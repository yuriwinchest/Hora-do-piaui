# Status da VPS (Producao) e Padrao Operacional

Este documento descreve o que foi implementado para manter varios sites na mesma VPS com isolamento (1 dominio = 1 app), SSL automatico e deploy sem efeito domino.

Importante:
- Este repo **nao guarda** IP da VPS, portas internas ou senhas.
- Onde aparecer `<VPS_IP>` e `<LEGACY_PORT>`, preencha no seu ambiente.

## Arquitetura (resumo)

- Traefik (edge) termina TLS e roteia por dominio.
- Cada dominio aponta para um container dedicado do app (ou conjunto de containers do app).
- O Nginx do host existe apenas como legado/apoio e fica **somente interno** (sem acesso externo).

## Dominio -> App (atual)

- `fatopago.com` (+ `www`) -> container do APP-01 (static nginx servindo build)
- `fazservico.com` (+ `www`) -> container do APP-02 (static nginx)
- `fazserviço.com.br` (IDN/punycode `xn--fazservio-x3a.com.br`) -> redirect para `https://fazservico.com/...`
- `horapiaui.com` (+ `www`) -> containers do APP-03 (`frontend` + `og` para `/noticia/`)

Canonical:
- `www.DOMINIO` -> redirect 308 -> `DOMINIO`

## Traefik (config dinamica)

Padrao atual do servidor:
- File provider por diretorio: `dynamic.d/` (1 arquivo por app/rota).
- Motivo: docker provider nao foi adotado neste servidor (compatibilidade de API).

Arquivos tipicos:
- `dynamic.d/10-fatopago.yml`
- `dynamic.d/11-fazservico.yml`
- `dynamic.d/01-horapiaui.yml`
- `dynamic.d/00-legacy.yml` (apenas redirects/legado)

## Isolamento por redes (Docker)

Padrao:
- `web` (compartilhada): somente containers HTTP que o Traefik precisa enxergar.
- `app_01_internal`, `app_02_internal`, `app_03_internal`: redes internas (tipo "internal") por app.

Regra:
- DB/redis/worker **nao entram** na `web`.

## Hardening aplicado

- Porta do legado no host travada em loopback (`127.0.0.1:<LEGACY_PORT>`, `[::1]:<LEGACY_PORT>`).
- Firewall: somente SSH e HTTP/HTTPS liberados externamente.
- `www -> root` aplicado via middleware do Traefik.
- Nginx (apps estaticos): `/assets/` sem fallback + cache; bloqueio de `/.env` e dotfiles.

## Fixes aplicados (incidentes reais)

### 1) `horapiaui.com` assets com MIME errado

Causa comum:
- Nginx nao consegue ler `/assets/*` (permissao), e cai no fallback para `index.html` (virando `text/html`).

Correcao aplicada:
- Ajuste de permissao em `/var/www/horapiaui/assets` para permitir leitura pelo Nginx.
- Nginx configurado para `location ^~ /assets/ { try_files $uri =404; }` (sem fallback).
- `index.html` com `Cache-Control: no-cache` para evitar HTML antigo apontando pra bundles inexistentes.

### 2) `fatopago.com` tentando carregar `/src/main.tsx`

Causa:
- Servir a raiz do projeto (dev) em vez do build.

Correcao aplicada:
- O container do app passou a servir somente o `dist/` (build).
- Bloqueio explicito de `/src/` e `/node_modules/` no Nginx do app.

## Deploy (padrao recomendado)

- 1 compose por app, executado dentro da pasta do app.
- Sempre usar project name fixo:
  - `docker compose -p app_01_fatopago up -d --remove-orphans`
  - `docker compose -p app_02_fazservico up -d --remove-orphans`
  - `docker compose -p app_03_horapiaui up -d --remove-orphans`

## Canary (pendente de DNS)

Para testar blue/green com baixo risco:
- Criar DNS:
  - `canary.fatopago.com` -> A -> `<VPS_IP>`
  - `canary.fazservico.com` -> A -> `<VPS_IP>`
- Subir `whoami` e criar um router canary no `dynamic.d/`.

