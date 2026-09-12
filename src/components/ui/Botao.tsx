import { ButtonHTMLAttributes } from "react";

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primaria" | "secundaria" | "perigo" | "texto" | "destaque";
  tamanho?: "sm" | "md" | "lg";
};

// Botões "3D pressionáveis" (mesma técnica do Duolingo): sombra sólida por
// baixo em vez de blur, some e o botão desce no :active — em vez de um
// blur genérico, parece um botão de verdade sendo apertado.
//
// A ação primária usa `jade` (verde de conquista), não `trail` (oliva escuro
// da marca): o botão principal é o gesto de avançar no jogo, e o oliva o
// fazia parecer um botão de formulário institucional. `trail` continua sendo
// a cor de cromo — sidebar, cabeçalho, links.
//
// "texto" fica de fora do tratamento 3D de propósito (usado em contextos
// discretos, tipo linha de tabela). "destaque" usa .btn-blaze (globals.css).
const VARIANTES: Record<NonNullable<BotaoProps["variante"]>, string> = {
  primaria:
    "bg-jade text-parchment-surface shadow-press-jade hover:bg-jade-vivid active:translate-y-[5px] active:shadow-none disabled:bg-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  secundaria:
    "bg-parchment-raised text-jade-strong border-2 border-jade shadow-press-rule hover:bg-jade-soft active:translate-y-[4px] active:shadow-none disabled:border-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  perigo:
    "bg-coral text-parchment-surface shadow-press-coral hover:brightness-110 active:translate-y-[5px] active:shadow-none disabled:bg-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  texto: "bg-transparent text-ink-soft hover:text-ink underline-offset-4 hover:underline",
  destaque: "btn-blaze text-white disabled:animate-none disabled:bg-rule disabled:text-ink-faint",
};

const TAMANHOS: Record<NonNullable<BotaoProps["tamanho"]>, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

// `uppercase` + `tracking-wide`: rótulo de botão de jogo, não de formulário.
// Todos os rótulos do app são curtos ("Responder", "Continuar", "Revisar
// aula"), então a caixa alta não quebra linha nem atropela a leitura.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold uppercase tracking-wide transition-[transform,box-shadow,background-color,filter] duration-150 disabled:cursor-not-allowed";
const BASE_TEXTO =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed";

export function Botao({
  variante = "primaria",
  tamanho = "md",
  className = "",
  ...props
}: BotaoProps) {
  if (variante === "texto") {
    return <button className={`${BASE_TEXTO} ${VARIANTES.texto} ${className}`} {...props} />;
  }

  return (
    <button className={`${BASE} ${TAMANHOS[tamanho]} ${VARIANTES[variante]} ${className}`} {...props} />
  );
}
