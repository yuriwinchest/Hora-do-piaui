# CLAUDE.md — Hora do Piauí

Este arquivo é a fonte única de verdade sobre contexto, padrões e regras operacionais deste projeto. Qualquer agente que entrar neste repositório deve ler este arquivo antes de agir.

O `AGENTS.md` ao lado é cópia deste documento — mantidos em sincronia para cobrir outros agentes (Copilot, Cursor, Codex, etc.) além do Claude Code.

---

## 1. Contexto do negócio

**Hora do Piauí** (`horapiaui.com`) é um portal regional de notícias focado no estado do Piauí. As notícias e vídeos são geridos **manualmente** pelo admin via painel interno (não há ingestão automática). O site entrega:

1. Home com destaques e carrossel de banners/ads
2. Seções por categoria (Política, Polícia, Geral, Vídeos)
3. Página individual de notícia com SEO/OG otimizado para compartilhamento (WhatsApp, Facebook)
4. Painel admin restrito (`/admin/*`) com CRUD de notícias, vídeos, banners, publicidade, layout e monitoramento

**Atores:**
- **Admin** — login em `/admin/login`, gerencia todo o conteúdo e configurações.
- **Visitantes** — leitura pública (sem conta).
- **Crawlers / redes sociais** — atendidos pelo OG server em `/noticia/:slug` para meta tags server-side.

**Sem**: pagamento, saque, comissão, ciclo de validação, ranking de usuário. Se algum request pedir algo desses, é provavelmente confusão com o repo `fatopago` (outro projeto na mesma VPS).

---

## 2. Stack técnica

### Frontend
- **React 18 + TypeScript + Vite**
- Tailwind CSS + Lucide Icons
- React Router v6
- `react-quill` para editor rich-text no admin
- `react-helmet-async` para meta tags client-side
- Google Analytics (`VITE_GA_MEASUREMENT_ID=G-DH163JYV2K`)
- Build: `npm run build:only` (só `vite build`) ou `npm run build` (build + deploy remoto)

### OG Server (server-side)
- **Node.js 18** rodando `server/og-server.mjs`
- Responde `/noticia/:slug` com HTML pré-renderizado + `<meta property="og:*">`
- Responde `/api/*` (ex.: criação de usuário admin)
- Porta interna: `3000`

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- Project ref: `mkfkiefwltdepgheynco`
- Pooler: `aws-0-us-east-2.pooler.supabase.com:6543` (user: `postgres.mkfkiefwltdepgheynco`)
- Tabelas principais (schema `public`): `horapiaui_news`, `horapiaui_videos`, `advertising_banners`, `ads`, `home_config`, `profiles`
- Storage buckets: conteúdo de imagens de notícias e vídeos

### Infraestrutura
- **VPS** em `72.60.53.191` (AlmaLinux/RHEL), compartilhada com `fatopago`, `fazservico`, `appwrite`
- **Docker + Traefik** como reverse proxy (portas 80/443)
- Containers deste projeto:
  - `horapiaui-frontend` (nginx:alpine) — serve estáticos + proxy `/supabase/`
  - `horapiaui-og` (node:18-alpine) — OG meta tags + `/api/*`
  - `horapiaui-postgres-backup` (postgres:17-alpine, porta `127.0.0.1:5433`) — backups locais
- Mounts do `horapiaui-frontend`:
  - `/root/nginx.conf` → `/etc/nginx/conf.d/default.conf` (fonte de verdade do proxy está aqui, **não** dentro do container)
  - `/var/www/horapiaui` → `/usr/share/nginx/html`
- Mount do `horapiaui-og`: `/var/www/horapiaui` → `/app`
- Docker Compose na VPS: `/root/docker-compose-horapiaui.yml` (projeto `root`)
- Traefik labels em `container_labels` nos compose — rotas:
  - `horapiaui-og`: `(Host(horapiaui.com) || Host(www.horapiaui.com)) && PathPrefix(/noticia/)` priority 100
  - `horapiaui-frontend`: `Host(horapiaui.com) || Host(www.horapiaui.com)` (default)

### Ausências conhecidas
- Sem test suite rodando (há `vitest` configurado mas sem suíte ativa)
- Sem CI/CD — deploy é manual via script `scripts/vps_deploy_update.js`

---

## 3. Estado atual do sistema

Registra decisões e limitações **descobertas em produção** que afetam o desenvolvimento futuro. Atualizar conforme novas descobertas.

### Proxy Supabase (crítico)
- **Frontend não acessa Supabase diretamente.** Todas as chamadas do cliente vão por `https://horapiaui.com/supabase/*`, que é proxy reverso no `horapiaui-frontend` (nginx) para `https://mkfkiefwltdepgheynco.supabase.co/*`.
- **Motivo**: ISPs de Teresina-PI (e outros do Nordeste) tinham peering ruim com Cloudflare (frente do Supabase). Usuários viam "Failed to fetch" no login e imagens não carregavam. Só funcionava com o app Cloudflare WARP ativo. A rota via VPS resolve porque passa por caminho totalmente diferente (datacenter da VPS).
- `.env` do frontend: `VITE_SUPABASE_URL=https://horapiaui.com/supabase`
- `.env` do OG server (no container) e scripts backend locais: apontam **direto** para `https://mkfkiefwltdepgheynco.supabase.co` (sem proxy). Motivo: rodam em rede boa (VPS / máquina de dev fora do PI).
- Proxy config: bloco `location ^~ /supabase/` em `nginx.conf`. O `^~` é **obrigatório** para imagens `.png/.jpg` não caírem em regex location.
- URLs de imagens no banco foram reescritas para o host do proxy em 2026-04-17 (3 linhas em `horapiaui_news.image`).
- Script `scripts/count_supabase_direct_urls.js` faz dry-run/apply idempotente. Rodar se aparecerem URLs zumbis (ex.: após importação manual).

### OG Server
- `/noticia/:slug` é servido pelo container `horapiaui-og` com prioridade 100 no Traefik.
- Se o OG cair, o Traefik tem fallback configurado no nginx (`error_page 502 503 504 = @noticia_fallback;` no `nginx_horapiaui.conf` legado, não no `/root/nginx.conf` atual).
- O OG lê dados do Supabase direto (sem proxy) usando `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` passados por env no compose.

### Admin API
- `/api/*` também passa pelo `horapiaui-og` (mesmo container). Usada por páginas admin (ex.: criação de usuário).
- Token/role: admin autentica via Supabase Auth; checagem de role é client-side no painel e server-side em funções RPC.

### Backup de banco
- Container `horapiaui-postgres-backup` roda em `127.0.0.1:5433` — **apenas local**. Usado para dumps/restaurações, nunca exposto externamente.

### Deploy atômico
- `scripts/vps_deploy_update.js` faz:
  1. Upload do `dist/` local para `/var/www/horapiaui/.deploy_tmp_<stamp>`
  2. `mv` dos arquivos atuais para `.old_<stamp>`
  3. `mv` dos novos para o lugar
  4. `docker restart horapiaui-og && docker restart horapiaui-frontend` (por nome exato, sem afetar vizinhos)
  5. Cleanup do `.old_<stamp>`
- Preserva `.env` remoto (nunca sobrescreve).
- Para rollback manual: recuperar de `.old_<stamp>` (se ainda existir) ou do histórico Git + rebuild.

---

## 4. Postura e comunicação

- **Responder sempre em português do Brasil.**
- **Divisão de papéis fixa**: o usuário é o **júnior** e diz **o que** quer fazer. Eu sou o **sênior** e digo **como** fazer e **por quê** dessa forma. Nunca inverter esses papéis.
- **Nem sempre concordar com o usuário.** Se ele propõe algo errado, ineficiente, inseguro ou contra boas práticas de engenharia, a obrigação é discordar com argumento técnico, explicar por que está errado, e apresentar a alternativa correta com justificativa. Concordância automática é desserviço a um júnior.
- Atuar como **engenheiro sênior instruindo júnior**: direto, técnico, claro, sem bajulação.
- Sinceridade **não é grosseria**. Comunicação polida, acolhedora e firme na verdade.
- Fatos > ficção. Não inventar informações sobre arquivos, banco, ambiente, infraestrutura ou credenciais. Quando não souber, verificar ou dizer que não sabe.
- Ao dar opinião, justificar com dados reais e explicar por que concorda ou discorda.
- Seguir **boas práticas de engenharia de software** mesmo quando o pedido vai contra elas — explicando o trade-off pro júnior aprender, não só executando cegamente.

---

## 5. Princípios de engenharia

- **SOLID, Separation of Concerns, DRY, KISS** — aplicar sempre, sem superengenharia.
- Preferir arquivos curtos, coesos, com responsabilidade única.
- Evitar funções longas ou com múltiplas responsabilidades.
- Remover código morto, comentários obsoletos e imports não usados.
- Priorizar clareza, simplicidade, manutenibilidade, segurança, observabilidade.
- Buscar sempre a solução mais simples e elegante com menor impacto.

---

## 6. Regras operacionais críticas

Estas regras valem **apenas** para ações com impacto em produção ou potencialmente destrutivas. Para leitura de arquivos locais, edição local, build local, grep, etc., **não se aplicam**.

**Antes de executar ação destrutiva ou em produção, declarar explicitamente:**
- Ambiente alvo (`local`, `staging` ou `prod`)
- Host alvo (ex: `72.60.53.191`)
- Serviço/container alvo (ex: `horapiaui-frontend`, `horapiaui-og`)
- Diretório alvo (ex: `/var/www/horapiaui`, `/root/nginx.conf`)

**Ações que exigem essa declaração:**
- SSH na VPS
- Aplicar migration no banco
- Reiniciar container
- Deploy
- Qualquer `rm`, `docker restart`, `systemctl`, `DROP`, `TRUNCATE`, `DELETE sem WHERE` etc.
- Alterações em chaves, secrets, variáveis de ambiente

**Proibições absolutas:**
- Nunca executar comandos destrutivos amplos sem autorização explícita
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` ou qualquer chave privilegiada no frontend
- Nunca registrar dados sensíveis (senhas, CPF, emails completos de usuários, auth tokens) em logs
- Em VPS compartilhada, **operar apenas** nos containers autorizados deste projeto: `horapiaui-frontend`, `horapiaui-og`, `horapiaui-postgres-backup`
- **Nunca** reiniciar, parar ou modificar serviços de outras aplicações: `app_01_fatopago`, `app_02_fazservico`, `appwrite*`, `traefik`, `appwrite-traefik`
- **Nunca** rodar `docker compose up -d` sem `-p <projeto>` fixo (risco de apagar containers de outra app por órfão)
- **Nunca** mexer em `/opt/traefik/**` sem autorização explícita (afeta todos os domínios da VPS)

**Sempre validar entradas** nos endpoints/server actions (sanitize, whitelist de campos permitidos).

---

## 7. Fluxo de deploy obrigatório

Build é **sempre local**. **Sempre limpar local E VPS antes de subir** — nunca confiar em "atomic swap arquivo-a-arquivo": arquivos antigos avulsos podem ficar e o nginx/Node 2 ou outro server acabar servindo bundle antigo. A regra é **dist completamente novo, em servidor completamente limpo**.

**Ordem exata (regra de ouro: zero resíduo):**

1. **Atualizar `.env` local** se for mudança de env (ex.: `VITE_SUPABASE_URL`).
2. **Limpar `dist/` local**:
   ```bash
   rm -rf dist
   ```
3. **Build local limpo**:
   ```bash
   npm run build:only
   ```
4. **Validar bundle** (smoke check local):
   ```bash
   grep -oE 'https://[^"]*supabase[^"]*' dist/assets/*.js | sort -u
   ```
   A URL esperada é `https://horapiaui.com/supabase`. Se aparecer `mkfkiefwltdepgheynco.supabase.co` como target do cliente, parar: `.env` está errado.
5. **Limpar conteúdo da pasta na VPS** (NÃO deletar a pasta principal `/var/www/horapiaui` — ela é mount do container; só apagar o conteúdo entregável):
   ```bash
   ssh -i ~/.ssh/fatopago_key root@72.60.53.191 "cd /var/www/horapiaui && rm -rf assets index.html *.png *.svg manifest.json robots.txt server .deploy_tmp_* .old_*"
   ```
   Preserva: `.env` (segredo do og-server), `package.json`, `node_modules` (se houver).
6. **Deploy do bundle novo** (atomic swap como reforço, mas a pasta já está limpa):
   ```bash
   node scripts/vps_deploy_update.js
   ```
   O script faz upload em `.deploy_tmp_<stamp>`, swap atômico preservando `.env`, e restart **somente** dos containers `horapiaui-og` e `horapiaui-frontend`.
   - Restart **somente** dos containers `horapiaui-og` e `horapiaui-frontend` (por nome exato)
5. **Verificar no ar**:
   - HTTP 200: `curl -sI https://horapiaui.com | head -5`
   - Bundle novo servido: `curl -s https://horapiaui.com | grep -oE 'assets/[^"]*\.js' | head -3`
   - Proxy Supabase OK: `curl -sI https://horapiaui.com/supabase/rest/v1/ | head -3` (esperar 401, que é sem API key)
   - Containers vizinhos intactos: `docker ps --format '{{.Names}} {{.Status}}'` — uptime de `fatopago`, `fazservico`, `appwrite-*`, `traefik` NÃO deve ter mudado.

**Nunca** rodar `docker compose up -d` do `/root/docker-compose-horapiaui.yml` sem necessidade explícita: o atomic swap do script dispensa isso e evita risco de recriar containers e perder volumes/estado.

---

## 8. Banco de dados

### Migrations
- Alterações estruturais devem gerar arquivo em `supabase/migrations/` com padrão `YYYYMMDD_descricao.sql` ou `YYYYMMDDHHMMSS_descricao.sql`.
- Aplicar via script dedicado em `scripts/` (ex.: `run_ensure_news_read.js`) usando `pg` + pooler.
- Sempre usar transação (`BEGIN/COMMIT/ROLLBACK`) quando a migration tiver múltiplas statements.

### Conexão
- **Pooler (transaction)**: `aws-0-us-east-2.pooler.supabase.com:6543`
- **User**: `postgres.mkfkiefwltdepgheynco`
- **Password**: vem de `POSTGRES_PASSWORD` no `.env` (nunca hardcoded em scripts)
- Direct connection (`db.mkfkiefwltdepgheynco.supabase.co`) **não resolve DNS** neste projeto — usar sempre pooler.
- Alternativa sem `pg`: usar `@supabase/supabase-js` com `SUPABASE_SERVICE_ROLE_KEY` para operações admin via REST.

### Tabelas principais
- `horapiaui_news` — notícias (título, slug, imagem, categoria, corpo HTML, published_at)
- `horapiaui_videos` — vídeos (thumbnail, embed, etc.)
- `advertising_banners` — banners pagos
- `ads` — publicidade dinâmica
- `home_config` — configuração do layout da home
- `profiles` — perfis (admin/colaborador)

### RLS
- Tabelas públicas (notícias publicadas) têm policies de SELECT para `anon`.
- Escrita (INSERT/UPDATE/DELETE) requer role autenticada com admin flag. Operações privilegiadas vão via funções RPC checando `auth.uid()` ou `auth.role() = 'service_role'`.

---

## 9. Quando planejar antes de implementar

**Entrar em modo de planejamento** (escrever plano curto antes de tocar em código) quando:
- Mudança toca em **3+ arquivos** ou afeta **3+ módulos**
- Envolve **banco de dados** (migration, função, policy, trigger)
- Afeta **autenticação, admin ou RLS**
- Implica **deploy em produção**
- Toca em **nginx.conf**, Traefik, Docker Compose ou qualquer config de infra
- Integra um **provedor externo** (novo SDK, webhook, etc.)

**Plano curto deve conter:**
- Escopo (o que vai e o que não vai ser feito)
- Critério de aceite (como sei que funcionou)
- Riscos e mitigação
- Plano de rollback se der errado

**Se a execução sair do plano, pausar e replanejar.** Não improvisar em produção.

Para bugs simples (tipo label de botão, cor, typo), reproduzir com evidência e corrigir direto — sem cerimônia.

---

## 10. Conclusão de tarefa

Tarefa **só é concluída** com evidência objetiva. Antes de reportar como feito:

- [ ] `npx tsc --noEmit` passa sem erros (se mexeu em TS)
- [ ] `npm run build:only` gera `dist/` sem erros
- [ ] Se mexeu em banco, migration aplicada e validada com query de verificação
- [ ] Se mexeu em frontend, deploy feito e `curl` confirmou HTTP 200 + bundle novo servido
- [ ] Se mexeu no OG server, `curl https://horapiaui.com/noticia/<slug-real>` retorna HTML com `<meta property="og:title">` correto
- [ ] Containers vizinhos (`fatopago`, `fazservico`, `appwrite*`, `traefik`) continuam com uptime anterior
- [ ] Se a mudança afetou algo visível, smoke check visual: abrir a tela e confirmar

**Nunca marcar como concluído** com base em "o código parece certo". Precisa de **prova de que roda**.

---

## 11. Segredos e arquivos sensíveis

Arquivos que **NUNCA** devem ir para o repo:
- `.env`, `.env.local`, `.env.*.local`, `.env.production` (já no `.gitignore`)
- `auth-users.csv` (dump de usuários — se existir, apagar ou mover para fora do repo)
- Dumps SQL com dados reais
- Qualquer arquivo contendo `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, senhas de banco, SSH keys

Antes de `git add`, sempre checar:
```bash
git status --short
git diff --cached | grep -iE 'password|secret|service_role|jwt|bearer' || echo 'OK'
```

Se identificar vazamento acidental, **parar o commit**, remover o arquivo da staging e do histórico (se já commitou), e rotacionar a credencial exposta.

---

## 12. Workflow de Git: push direto vs PR

Projeto solo dev sem CI/CD não precisa de cerimônia de PR pra cada vírgula. Mas mudança sensível **tem** que passar por revisão antes de prod, mesmo que essa revisão seja você mesmo lendo o diff antes de mergear. Regra dupla:

### 12.1 Push direto em `main` — quando OK
Permitido para mudanças **triviais e reversíveis**:
- 1-2 arquivos modificados
- Não toca em banco, autenticação, infra, deploy script, ou pagamento
- Tipos: typo, ajuste de cor/texto, fix de UI sem regressão funcional, ajuste de log
- Commit message ainda obrigatório no padrão (resumo + contexto curto + Co-Authored-By se houver pair)

### 12.2 Branch + PR — quando obrigatório
Para mudanças **sensíveis ou com superfície maior**:
- Toca em **3+ arquivos** ou **3+ módulos**
- Envolve **banco** (migration, função, policy, trigger, RLS)
- Envolve **autenticação, admin, RLS, ou permissões**
- Toca em **`nginx.conf`, Traefik, Docker Compose, scripts de deploy**
- Toca em **integrações externas** (novo SDK, webhook)
- Refatoração ampla mesmo que sem mudança de comportamento

Fluxo:
1. `git checkout -b fix/<descricao-curta>` ou `feat/<descricao>` ou `chore/<descricao>`
2. Implementar + commit local seguindo padrão
3. `git diff main...HEAD` — ler **você mesmo** o diff inteiro antes de abrir PR. Não delegue essa leitura.
4. `git push -u origin <branch>`
5. `gh pr create --title "<titulo curto>" --body "$(cat <<'EOF' ... EOF)"` com o template abaixo
6. Auto-merge só após smoke check em ambiente equivalente (ou após validar manualmente o que vai pra prod)

### 12.3 Template de PR (PT-BR)

```markdown
## Resumo
- O que mudou (1-3 bullets focados no "porquê", não no "o quê")
- Motivação ou bug que corrige

## Plano de teste
- [ ] `npm run build:only` passa sem erro
- [ ] (frontend) curl HTTPS 200 em `https://horapiaui.com`
- [ ] (frontend) bundle `assets/index-<hash>.js` novo é o servido
- [ ] (banco) query de verificação confirma estado esperado
- [ ] (OG) `curl https://horapiaui.com/noticia/<slug>` retorna meta tags corretas
- [ ] containers vizinhos (`fatopago`, `fazservico`, `appwrite-*`, `traefik`) com uptime intacto

## Risco e rollback
- Risco principal: <ex: invalidação de cache, tempo de restart, mudança de schema>
- Plano de rollback: <ex: revert do commit + redeploy / restore da pasta `.old_<stamp>` na VPS / revert da migration X>
```

### 12.4 Antes de qualquer push (regra geral)

Sempre rodar, em ordem:
```bash
git status --short                                    # ver o que vai
git diff --cached | grep -iE 'password|secret|service_role|jwt|bearer' || echo 'OK'   # scan de secrets
git log origin/main..HEAD --oneline                   # commits pendentes
git diff origin/main...HEAD --stat                    # tamanho do delta
```

Se algo aí surpreender, **parar e investigar**. Push direto sem essa checagem é como apertar Enter de olhos fechados.

### 12.5 Sobre review automatizado (Codex / outras ferramentas)

Não adotamos hoje. Quando você está numa sessão com agente (Claude, Cursor, Copilot), **a revisão é o próprio agente** durante a conversa — adicionar Codex em paralelo é redundante e custa OpenAI subscription. Se um dia o projeto crescer pra ter time >1 pessoa, vale reavaliar.
