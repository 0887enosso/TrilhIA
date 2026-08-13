/**
 * Início do dia no fuso de Brasília (UTC-3 fixo — o Brasil não usa mais
 * horário de verão desde 2019, então não precisa de lógica de fuso variável).
 * Usada por toda regra de jogo que vira "por dia" (streak, desafio diário,
 * estrelas diárias): antes cada uma tinha sua própria cópia local truncando
 * em UTC puro, o que deslocava a virada do dia para as 21h de Brasília — bem
 * no meio do horário mais comum de uso do app. Uma única função aqui evita
 * que essas cópias fiquem fora de sincronia entre si de novo.
 */
export function inicioDoDiaBrasil(data: Date): Date {
  const deslocado = new Date(data.getTime() - 3 * 60 * 60 * 1000);
  return new Date(Date.UTC(deslocado.getUTCFullYear(), deslocado.getUTCMonth(), deslocado.getUTCDate()));
}
