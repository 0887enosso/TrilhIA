# Frontend — Fase 3

Documenta as decisões da implementação do frontend (Next.js App Router + Tailwind, sobre o backend já completo da Fase 2). Complementa a proposta original de identidade visual (mapa de trilha, paleta, arquitetura de telas) que motivou esta implementação.

## Sistema do mascote

`src/components/mascote/`. São **10 PNGs** de arte final em `public/mascote/{pose}.png`, servidos por `next/image`. Qualquer tela usa `<Mascote pose="..." />` (`Mascote.tsx`); `poses.ts` mapeia cada pose ao seu texto acessível padrão. Poses: `andando`, `sorrindo`, `comemorando`, `tchau`, `pensando`, `cansado`, `certificado`, `sentado`, `parar`, `pulando`.

> Versões anteriores deste documento descreviam um sprite SVG (`MascoteSprite.tsx`) com 8 poses como `<symbol>`, referenciadas via `<use>`, e cores em `--masc-*` no `globals.css`. **Nada disso existe mais**: o sprite foi substituído por arte final em PNG, o componente foi removido e as variáveis CSS saíram junto. Se você procurou por esses nomes e não achou, é por isso.

Como o `next/image` faz lazy loading por padrão, uma pose que aparece de repente depois de uma ação só começaria a baixar naquele instante. É o caso da barra de feedback da questão, que só monta depois da resposta: medido em produção, a imagem levava 425ms e o mascote chegava quase 900ms após o clique — a reação atrasada justamente no momento em que ela existe para comemorar. Por isso existe `<PrecarregarPoses />` (mesmo arquivo), renderizado pelo `CartaoQuestao` enquanto a questão está na tela: baixa as três poses de reação (`comemorando`, `cansado`, `pensando`) com `priority`, para que a barra já encontre a imagem em cache.

## Paleta e tipografia

`tailwind.config.ts` — cores `parchment`/`ink`/`rule` (neutros), `trail` (estrutural/marca), `jade` (conquista: acerto, módulo concluído), `amber` (gamificação: XP, badges, estrelas), `coral` (semântico: corações, erro — nunca decorativo).

**Os dois verdes têm papéis distintos e não são intercambiáveis:** `trail` é cromo/marca (sidebar, cabeçalhos, CTA neutro), `jade` é conquista (acerto, nó concluído no mapa, barra de progresso). Trocar um pelo outro faz o app dizer "você acertou" onde ele só queria dizer "isto é o TrilhIA".

Cada família tem papéis de contraste: `DEFAULT` é preenchimento seguro (≥3:1), `vivid` só pode ser usado **dentro de um contorno escuro** (sozinho sobre fundo claro ele reprova em contraste), `strong` é para texto (≥4.5:1) e `soft` é fundo.

**Tipografia:** Nunito (`font-sans`) e Lora (`font-display`), carregadas por `next/font/google` em `src/app/layout.tsx` — baixadas no build e servidas pelo próprio domínio, expostas como `--font-nunito`/`--font-lora`. `font-display` (serifada) é reservada para contexto de *leitura*: título de aula dentro do módulo, enunciado de questão. `font-sans font-extrabold` é o padrão para título de tela/UI de jogo — decisão tomada depois que a primeira versão (tudo em serifa) leu como institucional demais, não como gamificação.

Para números que mudam no lugar (XP, contadores, posição no ranking) use `font-variant-tabular`, não `font-mono`: mantém a fonte da interface e só trava a largura dos dígitos, evitando o "pulo" de largura a cada mudança. `font-mono` ainda aparece nas telas de admin e em alguns rótulos — é resquício da versão anterior, não um padrão a seguir em tela nova.

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

`src/components/quiz/CartaoQuestao.tsx` — um componente único com um branch por tipo (`multipla_escolha`/`correcao_prompt` compartilham o mesmo branch, já que a API sanitiza os dois no mesmo formato). Fluxo: seleciona → envia → mostra explicação → "Continuar" (se certo/autoavaliada) ou volta para a aula relacionada (se errado). `ordenar_etapas` usa botões ↑/↓ em vez de arrastar-e-soltar — mais simples de implementar e mais acessível, sem dependência extra.

O resultado **não** aparece dentro do cartão: ele vai para `BarraFeedback.tsx`, fixa no rodapé. O motivo é de ritmo, não de enfeite — com o resultado inline, o botão de continuar nascia num lugar diferente a cada questão (dependia do tamanho do enunciado e da explicação), obrigando o usuário a procurar onde clicar a cada rodada. Fixa no rodapé, a ação fica sempre no mesmo pixel, que é o que permite encadear várias questões sem tirar a mão do lugar.

O gabarito nunca é revelado: a API manda só se a resposta enviada estava certa (`sanitizarQuestaoParaCliente`), porque o usuário pode tentar de novo. Na tela, só a alternativa escolhida ganha a cor do resultado — as demais apagam.

## O que fica para depois (não bloqueia o uso)

- **Versão mobile.** Decisão explícita: a prioridade atual é deixar o desktop inteiro sem problemas, e só depois estruturar o celular. O que já se sabe que precisa mudar lá: a sidebar fixa de 80px consome 20% de uma tela de 390px e o HUD quebra em três linhas — juntos, ~40% da altura/largura útil viram cromo antes do conteúdo começar. O padrão é barra inferior no mobile.
- Drag-and-drop para `ordenar_etapas`/`associacao`, se o time preferir à navegação por botões/select.
- Testes end-to-end da interface (os testes unitários de lógica pura em `src/lib/__tests__/` continuam cobrindo só o backend). Há verificação visual por captura de tela contra produção, mas é feita sob demanda, não automatizada.
- Acabamento visual das telas de autenticação e do painel admin, que não passaram pela repaginação.

### Itens desta lista que já foram feitos

Registrados aqui porque a lista acima os descrevia como pendentes até esta rodada:

- ~~Arte final do mascote~~ — feita: 10 PNGs em `public/mascote/`.
- ~~Página de ranking por liga específica no painel admin~~ — existe: `src/app/admin/ligas/[ligaId]/page.tsx`.
- ~~Rodar `npm install && npm run build` de verdade~~ — o projeto é construído, testado e publicado normalmente. **Verifique sempre pelo código de saída** (`$LASTEXITCODE` / exit code), nunca procurando `"Compiled successfully"` na saída: essa linha é impressa **antes** da checagem de tipos, então um erro de tipo passa despercebido por quem só olha o texto. Isso já derrubou 13 deploys seguidos enquanto o build era dado como bem-sucedido.
