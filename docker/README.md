# Docker e backup completo na VPS

## O que foi instalado

- **Docker** (imagem oficial)
- **PostgreSQL 16** em container (`horapiaui-postgres-backup`)
- **Banco `horapiaui`** restaurado dentro do Docker (texto, metadados, tudo)
- **Imagens** em `/opt/horapiaui-backup/images` – backup de todas as fotos do Supabase Storage
- **Arquivos .sql** em `/opt/horapiaui-backup/backups`

Se o Supabase bloquear ou o plano gratuito acabar, você tem banco e imagens completos na VPS.

## Usar o banco e imagens locais se o Supabase cair

**Banco** – conexão ao PostgreSQL restaurado:
```
Host: localhost (ou IP da VPS)
Porta: 5433
Usuário: backup
Senha: (definir em LOCAL_PG_PASSWORD no .env)
Banco: horapiaui
```

**Imagens** – arquivos em `/opt/horapiaui-backup/images/`. Para o site servir essas imagens, configure o frontend ou Nginx para mapear as URLs antigas do Supabase para esses arquivos locais.

## Corrigir script de backup (quebras de linha)

Conecte via SSH e rode:

```bash
# Converter CRLF para LF no script
sed -i 's/\r$//' /opt/horapiaui-backup/backup-supabase.sh
chmod +x /opt/horapiaui-backup/backup-supabase.sh

# Executar backup manual
cd /opt/horapiaui-backup && ./backup-supabase.sh
```

## Agendar backup diário (cron às 3h)

```bash
crontab -e
```

Adicione:
```
0 3 * * * cd /opt/horapiaui-backup && ./backup-supabase.sh >> /var/log/horapiaui-backup.log 2>&1
```

## Comandos úteis

```bash
# Ver containers
docker ps

# Ver backups
ls -la /opt/horapiaui-backup/backups/

# Parar PostgreSQL
cd /opt/horapiaui-backup && docker compose down

# Subir novamente
cd /opt/horapiaui-backup && docker compose up -d
```
