# Organizar VPS (Traefik + Legacy Nginx interno) — Roteiro Executavel (Fases 0 a 3)

Este arquivo e um checklist "copiar e colar" para aplicar o padrao do `padrão na VPS.md` com **baixo risco**, preparando a VPS para migracao por dominio com **canary (blue/green)** e sem "efeito domino".

Premissas do seu ambiente (confirmado/atualizado):
1. Traefik esta em `/opt/traefik` e ocupa as portas padrao de HTTP/HTTPS.
2. Nginx do host (legado) deve ficar **somente interno** (sem bind publico).
3. Traefik usa **file provider por diretorio**: `/opt/traefik/dynamic.d/*.yml`.
4. `fatopago.com` e `fazservico.com` ja rodam em containers dedicados (`app_01_fatopago`, `app_02_fazservico`) na network `web`.
5. `horapiaui-*` ja rodam em Docker e estao roteados pelo Traefik.

---

## Pre-Checks (antes de mexer em qualquer coisa)

Rode na VPS:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
ss -lntp | head -n 50
nginx -t
```

Confirme:
1. SSH esta ok.
2. Traefik esta nas portas padrao de HTTP/HTTPS.
3. Nginx host (legado) nao esta acessivel externamente.

---

## Fase 0: Segurança Basica (sem quebrar nada)

### 0.1 Backup do Traefik (acme.json + dynamic.yml)

```bash
set -e
cd /opt/traefik
cp -a acme.json "acme.json.bak.$(date +%Y%m%d_%H%M%S)"
cp -a dynamic.yml "dynamic.yml.bak.$(date +%Y%m%d_%H%M%S)"
ls -lah acme.json* dynamic.yml*
```

### 0.2 Garantir que a porta do legado nao esta publica (firewall)

Objetivo:
1. A porta do legado deve ser acessivel apenas internamente (se existir necessidade).
2. SSH e HTTP/HTTPS permanecem acessiveis.

Escolha o que existir na sua VPS:

Se tiver `firewalld`:
```bash
firewall-cmd --state
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
# Remover a porta do legado do exterior (se estiver exposta)
firewall-cmd --permanent --remove-port=<LEGACY_PORT>/tcp || true
firewall-cmd --reload
```

Se tiver `ufw`:
```bash
ufw status
ufw allow ssh
ufw allow http
ufw allow https
ufw deny <LEGACY_PORT>/tcp
ufw reload
```

Validacao (de fora da VPS, do seu PC):
1. `https://fatopago.com` deve continuar funcionando.
2. `http://VPS_IP:<LEGACY_PORT>` deve falhar (ou ficar inacessivel).

Importante:
1. Se o Traefik ainda depender do Nginx host (legado), cuidado ao travar o bind em loopback.
2. Quando o Traefik nao depender mais do Nginx host, a regra certa e travar o bind do legado em loopback:
   - `listen 127.0.0.1:<LEGACY_PORT>;` e `listen [::1]:<LEGACY_PORT>;`

---

## Fase 1: Padrao de Pastas + Compose Por App (ainda sem migrar rotas)

### 1.1 Criar base `/srv/apps`

```bash
mkdir -p /srv/apps
mkdir -p /srv/apps/APP-01_fatopago.com
mkdir -p /srv/apps/APP-02_fazservico.com.br
mkdir -p /srv/apps/APP-03_horapiaui.com
ls -lah /srv/apps
```

### 1.2 Criar network `web` (padrao Traefik)

O Traefik ja usa `networks: web` como external. Garanta que existe:

```bash
docker network ls | grep -E "^web\s" || docker network create web
docker network inspect web >/dev/null
```

### 1.3 Regra operacional (anote e siga sempre)

Para nunca derrubar outro app por engano:
1. Sempre use `-p` fixo por app.
2. Use `--remove-orphans` apenas com o `-p` correto.

Exemplos:
1. `docker compose -p app_01_fatopago up -d --remove-orphans`
2. `docker compose -p app_02_fazservico up -d --remove-orphans`
3. `docker compose -p app_03_horapiaui up -d --remove-orphans`

### 1.4 (Recomendado) Networks internas por app (isolamento real)

Objetivo:
1. `web` fica compartilhada apenas para o Traefik enxergar os containers HTTP.
2. Cada app tem uma rede interna (DB/redis/filas) sem acesso externo.

Padrao:
1. `app_01_internal`, `app_02_internal`, `app_03_internal` (tipo `--internal`)
2. Regra: so o container HTTP entra na `web`. Os demais so na `app_x_internal`.

Comandos:
```bash
docker network create --driver bridge --internal app_01_internal
docker network create --driver bridge --internal app_02_internal
docker network create --driver bridge --internal app_03_internal
```

Validacao:
```bash
docker network inspect app_01_internal --format "containers={{len .Containers}}"
```

---

## Fase 2: Separar Config Traefik Por Arquivo (Sem Docker Provider) (PADRAO ATUAL)

Neste servidor, o `providers.docker` do Traefik pode falhar (erro de API). Para manter isolamento e evitar "efeito domino" sem depender do Docker Provider, o padrao recomendado aqui e:

1. Trocar o file provider de `filename` para `directory`.
2. Criar **1 arquivo por app** em `/opt/traefik/dynamic.d/`.

### 2.1 Estrutura real hoje (referencia)

```bash
ls -la /opt/traefik/dynamic.d

# Hosts atuais (a fonte da verdade esta nesses arquivos):
grep -R --line-number -E 'Host\\(`|Host\\(' /opt/traefik/dynamic.d/*.yml || true
```

### 2.2 Trocar Traefik para ler o diretorio

Edite `/opt/traefik/docker-compose.yml`:
1. Trocar `--providers.file.filename=/etc/traefik/dynamic.yml` por `--providers.file.directory=/etc/traefik/dynamic.d`
2. Montar `./dynamic.d:/etc/traefik/dynamic.d:ro`

Depois:
```bash
cd /opt/traefik
docker compose up -d
docker logs --tail 100 traefik
```

### 2.3 (Recomendado) Canonical de dominio (www -> root)

Para evitar duplicidade (SEO) e padronizar:
1. `www.DOMINIO` redireciona para `DOMINIO`.

Implementacao (Traefik file provider):
1. Router continua aceitando `Host(root) || Host(www)`.
2. Adiciona middleware `redirectRegex` que so bate no `www.`.

Exemplo (fatopago):
```yml
middlewares:
  fatopago-www-to-root:
    redirectRegex:
      regex: "^https?://www\\.fatopago\\.com(.*)$"
      replacement: "https://fatopago.com$1"
      permanent: true
```

---

## Fase 3: Canary Piloto (blue/green) via File Provider (sem labels)

Objetivo:
1. Provar o padrao de deploy/rollback com um app novo "paralelo".
2. Nao tocar em `fatopago.com` e `fazservico.com.br` ainda.

### 3.1 DNS (necessario para TLS real)

Crie apontando para o IP da VPS:
1. `canary.fatopago.com`
2. `canary.fazservico.com`

### 3.2 Subir um container piloto (whoami) para validar canary

Na VPS:

```bash
set -e

# Container na network web para o Traefik resolver por DNS interno (HTTP)
docker rm -f app_00_whoami 2>/dev/null || true
docker run -d --name app_00_whoami --restart always --network web traefik/whoami:v1.10.3

# Rota canary via file provider
cat > /opt/traefik/dynamic.d/90-canary.yml <<'YAML'
http:
  routers:
    canary-whoami:
      rule: "Host(`canary.fatopago.com`)"
      service: canary-whoami
      entryPoints: [websecure]
      tls: { certResolver: myresolver }
  services:
    canary-whoami:
      loadBalancer:
        servers:
          - url: "http://app_00_whoami"
YAML

# File provider esta com watch=true; nao precisa reiniciar.
docker logs --tail 50 traefik
```

Validacao:
1. Acessar `https://canary.fatopago.com` e ver a resposta do whoami.

Remover piloto:
```bash
docker rm -f app_00_whoami
rm -f /opt/traefik/dynamic.d/90-canary.yml
```

---

## Proximo Passo (quando voce liberar)

Depois do piloto, a migracao real por dominio segue o mesmo modelo:
1. Subir `APP-01` ou `APP-02` em paralelo (v2).
2. Rota canary -> validar.
3. Cutover do dominio principal.
4. Manter legacy por 24-48h como fallback.
5. Rollback = voltar rota ou trocar tag da imagem.
