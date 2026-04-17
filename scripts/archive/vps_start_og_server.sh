#!/bin/bash
# Rodar na VPS para iniciar o servidor OG (foto da matéria no WhatsApp).
# Envie este script para a VPS e execute, ou rode direto:
#   cd /var/www/horapiaui && DIST_PATH=/var/www/horapiaui OG_PORT=3000 node server/og-server.js
#
# Na VPS, configure antes as env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# (arquivo .env em /var/www/horapiaui ou export no sistema / pm2).

cd /var/www/horapiaui || exit 1
export DIST_PATH=/var/www/horapiaui
export OG_PORT=3000
node server/og-server.js
