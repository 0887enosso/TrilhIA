# Stack Técnica — Decisões de Produto

Consolidação das decisões técnicas definidas no planejamento, para orientar a Fase 2 (backend) e a Fase 3 (frontend).

## Plataforma

- **Tipo de aplicativo:** Web app (acesso via navegador). Não é PWA nem app nativo mobile — decisão explícita para manter simplicidade de manutenção.
- **Integração externa:** nenhuma. O app é **standalone** — sem SSO corporativo, sem integração com RH, Slack ou outros sistemas internos do escritório.
- **Backend:** API routes do próprio Next.js — **confirmado**, sem serviço separado.
- **Hospedagem:** Vercel (aplicação) + **Supabase** (PostgreSQL gerenciado) — **confirmado**.
- **Repositório:** será criado do zero, não existe repositório prévio do projeto.

## Stack sugerida

- **Frontend:** Next.js + TypeScript + Tailwind.
- **Backend:** API routes do Next.js (confirmado — sem serviço separado).
- **Banco de dados:** Supabase (PostgreSQL gerenciado) + Prisma ORM.
- **Autenticação:** nickname/senha, sem SSO (decisão original era e-mail/senha — trocada para nickname em 2026-08-11, ver `docs/modelagem-dados.md`; cadastro também passou a exigir aprovação de admin antes do primeiro login). **Sem serviço de e-mail transacional** — recuperação de senha é assistida por admin, não por link enviado por e-mail (ver detalhe abaixo).
- **Hospedagem:** Vercel (aplicação) + Supabase (banco).

### Fluxo de recuperação de senha (decisão de segurança)

Senhas são armazenadas como hash (`senhaHash` no schema) — irreversível por design, então não é possível "reenviar a senha cadastrada" a um usuário que a esqueceu. Em vez de exigir serviço de e-mail transacional, o fluxo é assistido por admin:

1. Colaborador esquece a senha e avisa um admin (fora do app — verbalmente, Slack interno, etc.).
2. Admin acessa o painel administrativo e aciona "redefinir senha" para aquele usuário.
3. Sistema gera uma senha temporária aleatória e a exibe ao admin uma única vez (não fica salva em lugar nenhum além do hash).
4. Admin repassa a senha temporária ao colaborador por qualquer canal interno.
5. No próximo login, o sistema força a troca dessa senha temporária antes de liberar o uso do app (campo `precisaTrocarSenha` a ser adicionado ao model `Usuario`).

Resolve a mesma necessidade prática (colaborador travado, admin destrava) sem exigir e-mail transacional e sem armazenar senha de forma recuperável.

## Convenção de conteúdo que o backend precisa respeitar

O conteúdo das trilhas já está pronto em arquivos JSON estruturados (ver `content/`). Pontos que a modelagem do banco de dados deve preservar:

- Cada módulo é auto-contido e pode ser importado/seedado individualmente.
- `modulo_id` e o `id` de cada questão são as chaves estáveis para relacionar progresso do usuário — não gerar novos IDs no banco, reaproveitar os do conteúdo.
- Os campos de explicação (`explicacao`, `explicacao_acerto`, `explicacao_erro`) são parte do desenho pedagógico — devem ser exibidos como feedback imediato após a resposta, nunca omitidos.
- Ver `docs/gamificacao.md` para os campos `revisao_de` e `conquista_de_bloco`, que a lógica de backend deve interpretar.
- O schema completo de cada tipo de questão (incluindo os tipos `correcao_prompt` e `resposta_curta_autoavaliada`, introduzidos na Trilha Intermediária) está documentado em `content/trilha-intermediaria/README.md`.

## Decisões confirmadas nesta rodada

- **Conteúdo é lido diretamente dos arquivos JSON em `content/` como fonte de verdade** — não há importação para banco de dados. Edição futura de conteúdo acontece no repositório (via Claude Code ou edição manual dos JSONs), nunca por painel administrativo. Isso significa que o banco de dados **não tem tabelas de módulo/questão** — só tabelas de progresso do usuário, que referenciam os IDs estáveis já definidos no conteúdo (`modulo_id`, `id` de questão).
- Existe um **painel administrativo** no MVP, com visão agregada de progresso da equipe — mas ele não edita conteúdo, só visualiza dados de uso (ver `docs/gamificacao.md`).

## Decisões ainda em aberto (definir antes do deploy)

- Regra fina de corte de subida/descida dentro de cada liga por equipe.
- Nenhuma pendência de infraestrutura — Next.js, Vercel, Supabase e ausência de e-mail transacional já confirmados.
