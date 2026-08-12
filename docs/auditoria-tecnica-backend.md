# Auditoria Técnica do Backend — TrilhIA

**Elaborado por:** revisão de engenharia backend sênior, com foco em plataformas de jogos educacionais
**Escopo:** todo o código de `src/`, `prisma/schema.prisma` e `prisma/seed.ts` da Fase 2
**Metodologia:** leitura linha a linha do código real (não memória de o que foi escrito), com achados confirmados via grep/inspeção direta dos arquivos antes de qualquer conclusão listada abaixo.

> **Atualização (2ª rodada):** todos os itens de prioridade Crítica e Alta, e a maioria dos de prioridade Média, já foram corrigidos:
> - #2.1, #1.1, #1.2, #1.3 (crítica/alta) — corrigidos na 1ª rodada.
> - #4 (Módulo 30 sem captura de dado), #5.1 (Math.random em senha), #5.2 (sessão não invalida no reset), #5.3 (cadastro sem restrição de domínio — agora opcional via env), #5.4 (sem rate limit), #5.5 (sem usuário ativo/inativo) — corrigidos na 2ª rodada.
> - **Atualização (2026-08-11):** #5.3 foi substituído, não só corrigido — cadastro trocou de e-mail para nickname (não há mais domínio de e-mail para restringir) e ganhou um mecanismo mais forte: toda conta nova nasce `statusCadastro: PENDENTE` e só funciona depois que um admin aprova pelo painel. Ver `docs/modelagem-dados.md`.
>
> Ver `docs/modelagem-dados.md`, seção "Correções aplicadas da auditoria técnica", para onde cada uma está implementada. #3.1 (rota de conteúdo sanitizado), #3.2 (`GET /api/conquistas`) e #3.3 (`GET /api/progresso`) estão implementados. Pendências restantes: itens de robustez/observabilidade da seção 6 (log estruturado, diferenciar erro de conteúdo de erro de servidor, `ProgressoModulo.xpGanho` nunca preenchido, streak não atualizado no fluxo do Módulo 30, resposta bruta do usuário não persistida) e o rate limit de cadastro por IP (`src/lib/rateLimiter.ts`) confiar em `x-forwarded-for`, que é forjável pelo cliente.

---

## O que já está bem resolvido

Vale registrar antes das falhas: a decisão de conteúdo-fora-do-banco está bem executada, a validação de resposta contra o JSON (não confiar no cliente) é exatamente o padrão certo para evitar trapaça óbvia, e o uso de hash de senha + reset assistido por admin (sem senha reversível) está correto do ponto de vista de segurança. A separação em `src/lib/*.ts` por responsabilidade (content, xp, streak, ligas, conquistas) é uma boa base para continuar evoluindo.

---

## 1. Bugs de concorrência (condições de corrida reais)

Estes não são hipotéticos — em qualquer app com usuários reais, cliques duplos, abas múltiplas ou apenas dois dispositivos logados na mesma conta geram exatamente esses cenários.

### 1.1 Perda de XP sob concorrência
Em `src/app/api/progresso/questao/responder/route.ts`, o XP é somado assim:
```ts
const novoXpTotal = usuarioAntes.xpTotal + xpGanho;
await prisma.usuario.update({ data: { xpTotal: novoXpTotal, ... } });
```
Isso é um clássico **read-modify-write**: se duas requisições chegam quase juntas, as duas leem o mesmo `xpTotal`, e a segunda escrita sobrescreve a primeira — XP perdido, sem erro, sem log, silenciosamente.

**Correção:** usar o operador atômico do Prisma (`increment`) em vez de calcular o novo valor em memória.

### 1.2 Corações podem ficar negativos
```ts
data: { coracoesAtuais: { decrement: 1 } }
```
Isso é atômico, mas **sem piso**: se dois erros concorrentes acontecem com `coracoesAtuais = 1`, os dois passam pela checagem (`> 0`) antes de qualquer um decrementar, e os dois decrementam — resultado: `-1`. A UI provavelmente quebra tentando renderizar corações negativos.

**Correção:** usar `updateMany` com `where: { coracoesAtuais: { gt: 0 } }` para o decremento só se aplicar se ainda houver coração — decremento condicional, não só atômico.

### 1.3 XP duplicado na mesma questão
A checagem de "já ganhou XP por essa questão" é feita com um `count` + `findFirst` **antes** de criar o registro da resposta — não há nenhum lock ou constraint impedindo que duas requisições simultâneas para a mesma questão passem as duas pela checagem "ainda não tinha acertado" e as duas concedam XP.

**Correção:** a forma robusta é uma constraint de banco, não uma checagem em aplicação. Sugiro adicionar um registro "canônico" de primeira-vez-correta com `@@unique([usuarioId, questaoId])` numa tabela separada (ou reaproveitar um flag), e usar a falha de constraint (`P2002`) como o próprio mecanismo de exclusão mútua — se a criação falhar por duplicidade, é porque outra requisição já creditou o XP primeiro.

---

## 2. Falha de integridade — a mais grave da auditoria

### 2.1 `concluir módulo` não verifica se as questões foram respondidas

Isso é o achado mais sério da revisão inteira, e o mais relevante justamente pela ótica de "plataforma de jogo educacional": `POST /api/progresso/modulo/concluir` marca o módulo como concluído, concede badge de bloco e até **certificado**, sem checar em nenhum momento se o usuário respondeu qualquer questão daquele módulo. Uma chamada direta à API (fora do frontend — via curl, Postman, ou o próprio DevTools) conclui qualquer módulo instantaneamente, inclusive os 10 da trilha básica em sequência, ganhando o certificado completo sem nenhum esforço real.

Isso não é uma vulnerabilidade de segurança no sentido de vazar dado — é uma vulnerabilidade de **integridade do produto**: a métrica que sustenta todo o valor do certificado (⁠"essa pessoa realmente aprendeu isso") deixa de significar qualquer coisa.

**Correção:** antes de marcar `concluido: true`, o endpoint precisa validar que existe pelo menos uma `RespostaQuestao` com `correta: true` (ou registro de resposta, no caso de `resposta_curta_autoavaliada`) para cada questão do módulo — comparando contra a lista de questões lida do próprio JSON do módulo via `content.ts`.

---

## 3. Omissões que impedem o frontend de funcionar

### 3.1 Nenhuma rota entrega o conteúdo do módulo para o cliente
Todas as rotas que leem `content/*.json` (`carregarModulo`, `buscarQuestao`) fazem isso só internamente, para validar respostas — não existe **nenhuma rota GET que devolva o conteúdo de um módulo para o frontend renderizar**. Sem isso, não tem como montar a tela da lição.

**Atenção ao criar essa rota:** o JSON bruto do módulo contém o gabarito (`correta: true` dentro de `alternativas`, `etapas_corretas`, etc.). Servir esse JSON direto pro navegador expõe a resposta certa no painel de rede do DevTools — qualquer pessoa minimamente curiosa "ganha" o módulo. A rota precisa de uma função de sanitização que remova todo campo revelador de gabarito antes de responder ao cliente.

### 3.2 Conquistas e certificados são gravados, nunca lidos
`ConquistaUsuario` e `Certificado` são criados em `src/lib/conquistas.ts`, mas não existe nenhuma rota `GET` que devolva essas listas. O frontend não tem como mostrar "suas badges" ou emitir o certificado para download.

### 3.3 Sem rota agregada de progresso
Falta um `GET /api/progresso` (ou por trilha) que devolva, para o usuário logado, o status de cada módulo — necessário para desenhar o mapa de trilha com checkmarks.

---

## 4. O Módulo 30 (projeto prático) não captura nenhum dado

Esse é o módulo mais importante pedagogicamente da trilha inteira — e, no backend atual, o mais pobre em dado. Nada registra: qual dos 3 casos fictícios o colaborador recebeu, o que ele escreveu nas tarefas abertas, ou o resultado da autoavaliação pelo checklist. `concluir` para o módulo 30 hoje só marca `concluido: true` e concede a badge final — o conteúdo de fato produzido pelo usuário se perde.

**Correção sugerida:** um novo model (`EntregaProjetoFinal` ou similar) guardando `casoEscolhido`, as respostas de cada tarefa (texto livre) e o checklist marcado — pelo menos para permitir revisão futura, mesmo sem correção automática.

---

## 5. Segurança e ciclo de vida

### 5.1 `Math.random()` para gerar senha temporária
Em `src/lib/auth.ts`, `gerarSenhaTemporaria()` usa `Math.random()` — não é criptograficamente seguro. Para qualquer valor usado como credencial (mesmo temporária), isso é uma prática a evitar.

**Correção:** usar `crypto.randomInt()` (Node) ou `crypto.getRandomValues()` no lugar de `Math.random()`.

### 5.2 Reset de senha não invalida sessões antigas
Sessões são JWT stateless, sem lista de revogação. Se um admin reseta a senha de alguém (ex: suspeita de conta comprometida), qualquer sessão já aberta continua válida até expirar (7 dias) — o reset não "expulsa" ninguém.

**Correção:** adicionar um campo tipo `senhaAlteradaEm` no `Usuario`, incluir esse timestamp (ou uma versão) no payload do JWT, e invalidar sessões emitidas antes da última alteração de senha.

### 5.3 Cadastro sem restrição de domínio
`POST /api/auth/register` aceita qualquer e-mail, sem restringir a um domínio do escritório. Combinado com a ausência de verificação por e-mail (decisão já tomada, sem problema em si), isso significa que **qualquer pessoa na internet pode criar uma conta** no app hoje.

### 5.4 Sem rate limiting em nenhuma rota
Login e cadastro não têm limite de tentativas — abertos a força bruta de senha e criação em massa de contas automatizada.

### 5.5 Sem campo de usuário ativo/inativo
Quando um colaborador sai do escritório, hoje não existe forma de desativar a conta (só deletar, o que destrói histórico de progresso). Falta um campo `ativo: Boolean` no `Usuario`, checado no login.

---

## 6. Robustez e observabilidade

- **Erros de conteúdo mascarados como 404:** todo `try { carregarModulo(...) } catch { return 404 }` trata qualquer erro (incluindo um JSON corrompido ou um bug real de leitura de arquivo) como "módulo não encontrado". Isso confunde erro de cliente com erro de servidor e dificulta muito debugar em produção.
- **Nenhum log estruturado em nenhuma rota** — hoje, se algo falhar silenciosamente, não há rastro.
- **`resposta_curta_autoavaliada` não devolve os critérios de autoavaliação nem o exemplo de resposta forte** na resposta da API — o frontend precisa desses dois campos do JSON do módulo para o usuário se autoavaliar, e hoje `extrairExplicacao` não trata esse tipo.
- **A resposta bruta enviada pelo usuário nunca é salva** (`RespostaQuestao` não tem campo para isso) — perde dado valioso para analytics de conteúdo (que alternativa errada mais confunde as pessoas, por exemplo — informação diretamente útil para revisar conteúdo no futuro, como já fizemos na Fase 1).
- **`atualizarStreak` só é chamado ao responder questão** — quem está fazendo o Módulo 30 (sem perguntas de quiz) nunca atualiza o streak do dia, mesmo trabalhando ativamente no projeto mais denso da trilha.
- **`ProgressoModulo.xpGanho` existe no schema e nunca é preenchido** — campo morto, deveria ou ser removido ou populado (soma do XP das questões daquele módulo).

---

## Priorização recomendada

| Prioridade | Item | Risco se não corrigido |
|---|---|---|
| **Crítica** | #2.1 — concluir módulo sem checar respostas | Certificados e badges perdem todo significado |
| **Crítica** | #1.1 — race condition de XP | Perda silenciosa de XP em produção, sem log |
| **Alta** | #1.2 — corações negativos | Quebra de UI, estado inconsistente |
| **Alta** | #1.3 — XP duplicado | Inflação de XP, ranking de liga distorcido |
| **Alta** | #3.1 — sem rota de conteúdo (+ sanitização de gabarito) | Bloqueia o frontend inteiro; se malfeita, vaza resposta certa |
| **Alta** | #5.1 — Math.random() em senha | Credencial previsível |
| **Média** | #3.2 / #3.3 — sem leitura de conquistas/progresso agregado | Bloqueia telas específicas do frontend |
| **Média** | #4 — Módulo 30 sem captura de dado | Perde o conteúdo do módulo mais importante da trilha |
| **Média** | #5.2 — sessão não invalida no reset de senha | Janela de risco em caso de conta comprometida |
| **Média** | #5.3 / #5.4 — cadastro aberto, sem rate limit | Superfície de abuso, mas não compromete dado existente |
| **Baixa** | #5.5, #6 (todos) | Robustez/qualidade de vida operacional, não bloqueiam uso |

---

## Observação final

Nenhum desses pontos exige jogar fora o que já existe — são todos correções ou adições localizadas. Os dois itens "Crítica" (#2.1 e #1.1) eu recomendo corrigir antes de qualquer outra coisa, inclusive antes de começar a Fase 3: são exatamente o tipo de bug que, uma vez com usuários reais e dados reais no banco, fica muito mais caro de corrigir depois (XP e certificados já emitidos incorretamente são difíceis de "desfazer" de forma justa).
