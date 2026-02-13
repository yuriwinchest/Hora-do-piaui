# Documentação – Hora do Piauí

## Visão geral

Site de notícias (React + Vite + Supabase) com painel admin, backup completo na VPS e deploy automatizado.

---

## Backup completo na VPS

### Objetivo

Evitar dependência total do Supabase (plano gratuito pode bloquear). Backup automático na VPS com:

- **Banco de dados** – dump do Supabase e restauração no PostgreSQL local
- **Imagens** – download de todas as fotos do bucket `images` do Supabase Storage
- **Horário** – cron diário às 3h da manhã

### Estrutura na VPS

```
/opt/horapiaui-backup/
├── backups/          # Arquivos .sql (banco)
├── images/           # Fotos baixadas do Storage
├── scripts/          # backup-storage-standalone.js
├── backup-supabase.sh
└── docker-compose.yml
```

### Arquivos principais

| Arquivo | Descrição |
|---------|-----------|
| `docker/docker-compose.yml` | PostgreSQL local em container |
| `docker/backup-supabase.sh` | Script de backup (banco + imagens) |
| `scripts/backup-storage-standalone.js` | Download das imagens do Supabase Storage |
| `scripts/vps_complete_backup_setup.js` | Envia scripts para a VPS, executa backup e configura cron |
| `scripts/vps_install_docker.js` | Instala Docker e configura backup na VPS |

### Variáveis de ambiente necessárias

Criar arquivo `.env` (não commitar):

```env
# Supabase
POSTGRES_HOST=db.PROJETO.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=postgres
SUPABASE_URL=https://PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# VPS (SSH) - recomendado usar chave (sem senha)
VPS_HOST=...
VPS_USER=root
VPS_SSH_KEY_PATH=...

# PostgreSQL local (Docker)
LOCAL_PG_PASSWORD=...
```

### Comandos

```bash
# Backup manual (local → VPS)
npm run vps:backup

# Instalação inicial do Docker e backup na VPS
node scripts/vps_install_docker.js

# Setup completo (banco + imagens + cron)
node scripts/vps_complete_backup_setup.js
```

---

## Deploy do frontend

Tudo que precisa para acessar a VPS e o banco está no `.env`. O deploy usa SSH (recomendado).

### Como subir na VPS (passo a passo)

1. **Deploy do site (dist + server)**  
   ```bash
   npm run deploy
   ```  
   Faz: **apaga o `dist` local** → **build** (`vite build`) → **apaga o conteúdo de `/var/www/horapiaui` na VPS** → **sobe o novo `dist` e a pasta `server/`** para `/var/www/horapiaui`. Usa do `.env`: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY_PATH`.

2. **Atualizar Nginx na VPS**  
   ```bash
   node scripts/vps_nginx_update.js
   ```  
   Envia o `nginx_horapiaui.conf` do projeto para a VPS e recarrega o Nginx (proxy `/noticia/` → servidor OG, fallback se o servidor estiver parado).

3. **Subir o servidor OG (foto da matéria no WhatsApp)**  
   ```bash
   node scripts/vps_start_og_server.js
   ```  
   Via SSH: cria `.env` em `/var/www/horapiaui` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (do seu `.env` local) e inicia o servidor OG com **pm2** (ou nohup se pm2 não existir).

**Acesso:**  
- **VPS** – via SSH com os dados do `.env`; os scripts acima fazem isso por você.  
- **Banco** – via CLI usando as credenciais do `.env`: `node scripts/run_migration.js` (Supabase) ou conexão direta com os dados de conexão que estão no sistema (`.env`).

### O que o deploy NÃO toca (cuidados)

- **Docker** – tudo em `/opt/horapiaui-backup/` (PostgreSQL, backups, imagens, cron) **não é alterado**.
- **Outro domínio** na VPS – o deploy só mexe em `/var/www/horapiaui`. Outro site (ex.: outro diretório em `/var/www/` ou outro app no pm2) **não é alterado**.

---

## Compartilhamento WhatsApp – foto da matéria

Para ao compartilhar um link de notícia no WhatsApp aparecer a **foto da matéria** (e não a logo):

1. **Deploy** – O `npm run deploy` já envia a pasta `server/` para a VPS.
2. **Nginx** – Use o `nginx_horapiaui.conf` do projeto (já tem o proxy de `/noticia/` para o servidor OG na porta 3000 e fallback se o servidor estiver parado). Copie para a VPS e recarregue: `nginx -s reload`.
3. **Rodar o servidor OG na VPS** – Na VPS, configure as env do Supabase (o mesmo banco do site) e inicie o servidor:
   - Crie em `/var/www/horapiaui` um `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou exporte no sistema / pm2).
   - Rode: `cd /var/www/horapiaui && DIST_PATH=/var/www/horapiaui OG_PORT=3000 node server/og-server.js`
   - Para ficar sempre ligado: use **pm2** – `pm2 start server/og-server.js --name og-server --cwd /var/www/horapiaui` e defina as env no ecosystem ou no .env na mesma pasta.

O servidor OG lê a notícia no **Supabase** (tabela `horapiaui_news`, coluna `image`). Se ao trocar de banco a coluna `image` ficou vazia ou com URL quebrada, a foto da matéria não aparece; garanta que cada notícia tenha a URL da imagem no banco.

**Porta:** o servidor OG usa a porta **3001** (a 3000 é do outro site na VPS). O Nginx faz proxy de `/noticia/` para `127.0.0.1:3001`. O servidor carrega o `.env` de `/var/www/horapiaui/.env` (caminho fixo em relação ao `server/`), para funcionar corretamente com pm2.

---

## Migrations (Supabase)

```bash
node scripts/run_migration.js
```

---

## Estrutura do projeto

Aplicação roda **somente na VPS** (Nginx + arquivos estáticos em `/var/www/horapiaui`). Não há Vercel.

```
├── api/              # Código legado (não usado na VPS)
├── components/       # Componentes React
├── docker/           # Docker e scripts de backup
├── docs/             # Documentação
├── server/           # Servidor OG + endpoints internos (ex.: /api/admin/create-user)
├── hooks/            # useNews, useAuth
├── pages/            # Páginas
├── scripts/          # Scripts de deploy, backup, migration
├── supabase/         # Migrations SQL
└── utils/            # upload, slugify, mappers
```

---

## Segurança

- **Não commitar**: `.env` (contém chaves, senhas, tokens)
- **`.gitignore`** inclui `.env` e variantes
- Credenciais vêm de variáveis de ambiente
- Scripts de backup injetam credenciais apenas na execução (não ficam no código)
