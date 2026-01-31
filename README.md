# Hora do Piauí

Site de notícias com painel admin, backup completo na VPS e deploy automatizado.

## Documentação

Ver [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md) para:
- Backup completo (banco + imagens) na VPS
- Deploy do frontend
- Variáveis de ambiente
- Segurança (credenciais)

## Setup

1. Copie `.env.example` para `.env` e preencha as variáveis
2. `npm install`
3. `npm run dev`

## Deploy

```bash
npm run deploy
```

## Backup na VPS

```bash
npm run vps:backup
```
