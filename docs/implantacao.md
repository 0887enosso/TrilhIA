# Guia de Implantação — Claude Code, Supabase e Vercel

Este documento cobre a transição de "projeto gerado em conversa" para "projeto rodando de verdade": como colocar o TrilhIA no Claude Code para continuar o desenvolvimento, provisionar o banco de dados, e publicar em produção na Vercel. Siga na ordem — cada parte depende da anterior.

**Onde você já está:** o Supabase já está provisionado e o `.env` local já tem `DATABASE_URL`/`DIRECT_URL`/`JWT_SECRET`/`CRON_SECRET` reais (a Parte 2 abaixo já está feita — deixei documentada só como referência). O que falta é: inicializar o Git, subir para o GitHub e publicar na Vercel (Partes 1 e 3).

## Parte 1 — Git e GitHub

1. **Inicialize o repositório** dentro da pasta do projeto:
   ```bash
   cd trilhia
   git init
   git add .
   git commit -m "TrilhIA — Fases 1, 2 e 3"
   ```
   O `.gitignore` já exclui `.env`, `node_modules` e `.next` — confira com `git status` antes de commitar que nenhum desses apareceu na lista.
2. **Crie um repositório no GitHub** (vazio, sem README) e conecte:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/trilhia.git
   git branch -M main
   git push -u origin main
   ```

## Parte 2 — Banco de dados (Supabase) — já feito, referência

1. Conta e projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database → Connection string**: **Transaction pooler** (porta `6543`, com `?pgbouncer=true`) vai em `DATABASE_URL`; **Direct connection** (porta `5432`) vai em `DIRECT_URL` (o Prisma Migrate precisa da conexão direta).
3. Schema aplicado via `npm run prisma:generate` + `npm run prisma:migrate`.
4. Seed rodado via `npm run prisma:seed` (cria as 3 equipes, as ligas e o admin inicial).

## Parte 3 — Publicar na Vercel

1. Em [vercel.com](https://vercel.com), **Add New → Project**, importe o repositório do GitHub que você criou na Parte 1.
2. A Vercel detecta Next.js automaticamente — não precisa mexer no comando de build.
3. **Antes do primeiro deploy**, configure as variáveis de ambiente em *Project → Settings → Environment Variables*, usando os mesmos valores do seu `.env` local (ou gere segredos novos para produção, o que é mais seguro):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `CRON_SECRET`
4. **`postinstall` já está no `package.json`** (`"postinstall": "prisma generate"`) — sem isso o build falha, porque o Next.js compila código que importa o cliente Prisma antes dele existir. Não precisa mexer, só confirmar que não foi removido.
5. Clique em **Deploy**.
6. Depois do primeiro deploy, confira em *Project → Settings → Cron Jobs* se o job semanal apareceu — a Vercel lê o `vercel.json` automaticamente. **Não precisa configurar nenhum header manualmente** — a Vercel injeta `Authorization: Bearer <CRON_SECRET>` sozinha em toda chamada de cron, usando o valor configurado no passo 3.

### Duas coisas específicas do plano Vercel para conferir

- **Plano Hobby (gratuito) só permite cron no máximo uma vez por dia.** O nosso roda uma vez por *semana* (`0 6 * * 1` no `vercel.json`), então está dentro do limite.
- **Timeout de função no Hobby é 10 segundos.** A rotina semanal (`/api/cron/semanal`) processa todas as ligas e usuários — com poucas equipes deve rodar bem dentro disso, mas se o número de colaboradores crescer bastante, vale monitorar o tempo de execução nos logs da Vercel e considerar o plano Pro (timeout de 60s) se começar a estourar.

## Parte 4 — Depois do primeiro deploy

1. Se as variáveis de produção apontarem para um banco diferente do que você já usa localmente, rode as migrations e o seed contra ele (pode ser do seu computador, apontando `DATABASE_URL`/`DIRECT_URL` do `.env` para os valores de produção — não precisa estar "dentro" da Vercel):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
   Se estiver usando o **mesmo** banco Supabase local e de produção, pule este passo — os dados (incluindo o admin) já estão lá.
2. Acesse a URL pública do projeto e faça login com o nickname/senha do admin. Se a senha ainda for a temporária, o app já força a troca no primeiro login (`precisaTrocarSenha`).
3. Peça para novos colaboradores se cadastrarem em `/cadastro` (nome, nickname, senha, equipe) e aprove o acesso deles no painel admin (`/admin/usuarios`) — sem aprovação, ninguém entra.

## Resumo das variáveis de ambiente

| Variável | Onde conseguir |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Painel do Supabase → Database → Connection string |
| `JWT_SECRET` | Gerado por você (string aleatória forte, ex: `openssl rand -base64 32`) |
| `CRON_SECRET` | Gerado por você (string aleatória forte) — a Vercel usa isso automaticamente |
