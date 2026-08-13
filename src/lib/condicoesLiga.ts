/**
 * Único lugar que define quais valores de `Liga.condicaoDesbloqueio` o
 * código realmente reconhece (ver `ligasElegiveis` em `src/lib/ligas.ts`).
 * Sem dependência de Prisma de propósito — é importado tanto pela API de
 * criação de liga (servidor) quanto pelo formulário do painel admin
 * (cliente). Antes disso, o campo era texto livre sem validação: uma liga
 * criada com a condição digitada errado ficava para sempre sem nenhum
 * participante possível, sem nenhum aviso. Uma condição futura nova entra
 * aqui, e automaticamente passa a ser aceita pela validação da API e listada
 * no formulário — só falta implementar o `else if` correspondente em
 * `ligasElegiveis`.
 */
export const CONDICOES_DESBLOQUEIO_VALORES = ["trilha_basica_concluida"] as const;

export const CONDICOES_DESBLOQUEIO_ROTULOS: Record<
  (typeof CONDICOES_DESBLOQUEIO_VALORES)[number],
  string
> = {
  trilha_basica_concluida: "Trilha Básica concluída",
};
