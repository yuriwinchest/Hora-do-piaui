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

# VPS (SSH)
VPS_HOST=...
VPS_USER=root
VPS_PASSWORD=...

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

```bash
npm run deploy
```

Faz: limpa `dist`, build, limpa VPS, envia arquivos para `/var/www/horapiaui`.

---

## Migrations (Supabase)

```bash
node scripts/run_migration.js
```

---

## Estrutura do projeto

```
├── api/              # API routes (Vercel)
├── components/       # Componentes React
├── docker/           # Docker e scripts de backup
├── docs/             # Documentação
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
