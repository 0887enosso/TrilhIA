# Frontend — Fase 3

Documenta as decisões da implementação do frontend (Next.js App Router + Tailwind, sobre o backend já completo da Fase 2). Complementa a proposta original de identidade visual (mapa de trilha, paleta, arquitetura de telas) que motivou esta implementação.

## Sistema do mascote

`src/components/mascote/`. Um único sprite SVG oculto (`MascoteSprite.tsx`, renderizado uma vez em `src/app/layout.tsx`) define 8 poses como `<symbol>`; qualquer tela usa `<Mascote pose="..." />` (`Mascote.tsx`), que referencia o símbolo via `<use>`. Poses disponíveis (`poses.ts`): `andando`, `sorrindo`, `comemorando`, `tchau`, `pensando`, `cansado`, `certificado`, `sentado`.

**Redesenho em relação ao rascunho original:** o desenho enviado seguia de perto uma minifigura licenciada (chapéu fedora bicudo, chicote, jaqueta de couro, bolsa a tiracolo, mãos em garra — reconhecível como Indiana Jones/LEGO). O mascote implementado preserva o "esqueleto" (proporções de boneco articulado: cabeça cilíndrica, torso em bloco, membros retos) mas redesenha todo o figurino com elementos próprios: pele em tom parchment (não amarelo-brinquedo), chapéu de aba curta com emblema de bússola, colete com bolsos, mãos redondas (não em garra), bússola/certificado/lupa como acessórios em vez de chicote. Cores em `src/app/globals.css` (`--masc-*`).

As 4 poses novas (além das 4 originais) foram criadas para mecânicas que o produto já tem mas o rascunho não cobria: `pensando` (carregamento), `cansado` (0 corações), `certificado` (emissão de certificado), `sentado` (estados vazios).

**Pendência de design:** as poses são ilustrações vetoriais simples (formas geométricas), suficientes para o MVP funcionar e para validar a composição/onde cada pose aparece — mas não substituem arte final desenhada à mão ou gerada por um designer, se o time quiser um acabamento mais rico.

## Paleta e tipografia

`tailwind.config.ts` — cores `parchment`/`ink`/`rule` (neutros), `trail` (estrutural/marca), `amber` (gamificação: XP, badges, estrelas), `coral` (semântico: corações, erro — nunca decorativo). Tipografia: `font-display` (serifada) reservada para contexto de *leitura* (título de aula dentro do módulo, enunciado de questão); `font-sans font-extrabold` é o padrão para título de tela/UI de jogo (dashboard, mapa de trilha, sidebar, conquistas, liga) — decisão tomada depois que a primeira versão (tudo em serifa/parchment) leu como institucional demais, não como gamificação. `font-mono` para dados (XP, IDs, contadores).

### Acento "blaze" e botões 3D

Dois elementos que existem só para injetar energia de jogo, de propósito concentrados em poucos lugares (ver a regra de "gastar a ousadia num só canto" nas notas de design):

- **Botões 3D pressionáveis** (`src/components/ui/Botao.tsx`): sombra sólida embaixo (`shadow-[0_5px_0_<tom mais escuro>]`) que some e o botão desce (`active:translate-y-[5px] active:shadow-none`) — a mesma técnica usada pelo Duolingo, não um blur genérico.
- **`.btn-blaze`** (`src/app/globals.css`): CTA de máxima energia, usado só no desafio diário (item da sidebar, cartão do dashboard, cabeçalho da página). Gradiente laranja→vermelho, box-shadow "respirando" (pulsa de tamanho/opacidade, técnica comum em botões CTA do Uiverse) + um anel (`::after`) que expande e desaparece, acelera no hover, desliga no `:active`, respeita `prefers-reduced-motion`. Tokens em `--blaze-*` (`globals.css`).

## Navegação: sidebar, não escolha livre de trilha

A navegação saiu do topo (`Header`/`NavLinks`, removidos) para uma sidebar expansível/recolhível à esquerda (`src/components/app/Sidebar.tsx` + `AppShell.tsx`, estado persistido em `localStorage`). A barra de status do jogo (streak/corações/estrelas/XP) continua no topo, mas agora numa faixa fina (`TopHud.tsx`) — só HUD, sem navegação.

O menu não tem mais botões separados para "Trilha Básica" e "Trilha Intermediária" — existe um único item "Trilha", que aponta para `/trilha` (`src/app/(app)/trilha/page.tsx`), uma rota que decide pra qual trilha redirecionar: a intermediária só libera depois que `obterProgressoAgregado().basica.trilhaConcluida` é `true`. O mesmo guard existe em três camadas (defesa em profundidade, não só esconder o link):
1. `/trilha/page.tsx` — decide o redirect.
2. `/trilha/[trilha]/page.tsx` e `/trilha/[trilha]/[moduloId]/page.tsx` — redirecionam pra `/trilha/basica` se alguém tentar acessar a intermediária direto pela URL sem ter concluído a básica.
3. `POST /api/progresso/modulo/iniciar` — rejeita com `403` e `codigo: "trilha_bloqueada"` mesmo se a chamada vier direto da API, sem passar pelo frontend.

## Arquitetura de dados

Duas camadas, para não pagar uma volta HTTP extra em toda leitura de página:

- **Leituras** (mapa de trilha, dashboard, conquistas, liga, admin): as páginas são Server Components que chamam diretamente as funções de `src/lib/*.ts` (`obterProgressoAgregado`, `obterConquistasDoUsuario`, `obterRankingSemanalDoUsuario`, `obterResumoUsuario`, `obterUsuariosParaAdmin`) — as mesmas funções que as rotas `GET` de API chamam, para uso externo/programático. Zero duplicação de lógica entre página e rota.
- **Mutações** (login, cadastro, responder questão, concluir módulo, ações de admin): Client Components fazem `fetch` para as rotas de API existentes (cookie de sessão httpOnly é enviado automaticamente em same-origin). Reaproveita toda a validação/rate limiting/lógica de gamificação já implementada — nada foi duplicado em Server Actions paralelas.

Guardas de autenticação ficam nos layouts (`(app)/layout.tsx`, `admin/layout.tsx`, `trocar-senha/page.tsx`), não no `middleware.ts` (que continua só protegendo `/api/admin/*`, conforme já documentado — Edge Runtime não roda Prisma).

## Novo endpoint desta rodada

`GET /api/ligas` — ranking da semana corrente nas ligas do usuário logado (`src/lib/ligas.ts#obterRankingSemanalDoUsuario`). Só existia leitura de ranking pelo painel admin; o colaborador não tinha rota própria para ver a própria posição.

## Telas implementadas

| Rota | O que faz |
|---|---|
| `/login`, `/cadastro`, `/trocar-senha` | Autenticação — fora do shell autenticado |
| `/inicio` | Dashboard: streak/corações/estrelas (no header), continuar módulo, progresso por trilha, atalhos |
| `/trilha/[trilha]` | Mapa de trilha — status de cada módulo, agrupado por bloco |
| `/trilha/[trilha]/[moduloId]` | Aula → atividade → repete → atividade final → conclusão. Módulo 30 (`tipo_modulo: "projeto_pratico"`) usa um fluxo dedicado (escolha de caso, tarefas abertas, checklist) |
| `/desafio-diario` | 5 questões de revisão, bônus de XP ao concluir |
| `/conquistas` | Badges + certificados (com botão de impressão) |
| `/liga` | Ranking semanal por liga elegível |
| `/admin/usuarios` | Promover/rebaixar, ativar/desativar, resetar senha |
| `/admin/equipes`, `/admin/ligas` | Listagem + criação |

## Componentes de questão

`src/components/quiz/CartaoQuestao.tsx` — um componente único com um branch por tipo (`multipla_escolha`/`correcao_prompt` compartilham o mesmo branch, já que a API sanitiza os dois no mesmo formato). Fluxo: seleciona → envia → mostra explicação → "Continuar" (se certo/autoavaliada) ou "Tentar novamente" (se errado, reseta a seleção sem perder a questão). `ordenar_etapas` usa botões ↑/↓ em vez de arrastar-e-soltar — mais simples de implementar e mais acessível, sem dependência extra.

## O que fica para depois (não bloqueia o uso)

- Arte final do mascote (ver "Pendência de design" acima).
- Drag-and-drop para `ordenar_etapas`/`associacao`, se o time preferir à navegação por botões/select.
- Página de ranking por liga específica no painel admin (a rota de API já existe: `GET /api/admin/ligas/[ligaId]/ranking`).
- Testes end-to-end da interface (os testes unitários de lógica pura em `src/lib/__tests__/` continuam cobrindo só o backend).
- Rodar `npm install && npm run build` de verdade — este frontend foi escrito sem acesso a `node_modules` neste ambiente (mesma limitação de sandbox já registrada em `docs/implantacao.md`); revisar a saída do build antes de confiar no código.
