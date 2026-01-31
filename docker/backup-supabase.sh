#!/bin/bash
# Backup do banco Supabase e restaura dentro do PostgreSQL local na VPS
# Se o Supabase cair, você tem o banco completo na VPS (texto, metadados, URLs)
# Imagens: URLs ficam no banco; arquivos reais continuam no Supabase Storage

BACKUP_DIR="${BACKUP_DIR:-/opt/horapiaui-backup/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/horapiaui_$DATE.sql"
CONTAINER="horapiaui-postgres-backup"
LOCAL_PG_USER="${LOCAL_PG_USER:-backup}"

# Conexão Supabase (variáveis de ambiente)
PGHOST="${POSTGRES_HOST}"
PGPORT=5432
PGUSER="${POSTGRES_USER:-postgres}"
PGPASSWORD="${POSTGRES_PASSWORD}"
PGDATABASE="${POSTGRES_DATABASE:-postgres}"

mkdir -p "$BACKUP_DIR"

echo "=== 1. Dump do Supabase ==="
docker run --rm --network=host \
  -e PGPASSWORD="$PGPASSWORD" \
  -e PGSSLMODE=require \
  -v "$BACKUP_DIR:/backups" \
  postgres:17-alpine \
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  --no-owner --no-acl -F p -f "/backups/horapiaui_$DATE.sql"

if [ $? -ne 0 ]; then
  echo "Erro no dump do Supabase"
  exit 1
fi
echo "Dump OK: $FILE"

echo "=== 2. Restaurando no PostgreSQL local (Docker) ==="
docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d postgres -t -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = 'horapiaui' AND pid <> pg_backend_pid();
" 2>/dev/null || true

docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d postgres -c "DROP DATABASE IF EXISTS horapiaui;" 2>/dev/null || true
docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d postgres -c "CREATE DATABASE horapiaui;"
docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d horapiaui -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d horapiaui -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true

docker exec "$CONTAINER" psql -U "$LOCAL_PG_USER" -d horapiaui -v ON_ERROR_STOP=0 -f "/backups/horapiaui_$DATE.sql" 2>/dev/null && echo "Restore OK: banco 'horapiaui' no container $CONTAINER"

echo "=== 3. Backup das imagens do Supabase Storage ==="
IMAGES_DIR="${IMAGES_DIR:-/opt/horapiaui-backup/images}"
mkdir -p "$IMAGES_DIR"
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  docker run --rm --network=host \
    -v "$IMAGES_DIR:/out" \
    -v "/opt/horapiaui-backup/scripts:/scripts" \
    -e SUPABASE_URL="$SUPABASE_URL" \
    -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    -e BACKUP_IMAGES_DIR=/out \
    -w /scripts \
    node:20-alpine \
    node backup-storage-standalone.js 2>/dev/null && echo "Imagens OK: $IMAGES_DIR" || echo "Imagens: falha (Supabase pode estar bloqueado)"
else
  echo "Imagens: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao definidos"
fi

echo "=== 4. Mantendo ultimos 7 backups ==="
ls -t "$BACKUP_DIR"/horapiaui_*.sql 2>/dev/null | tail -n +8 | xargs -r rm -f

echo "=== Concluido ==="
echo "Banco local: host localhost port 5433 user backup db horapiaui"
echo "Imagens locais: $IMAGES_DIR"
