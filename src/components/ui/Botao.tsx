import { ButtonHTMLAttributes } from "react";

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primaria" | "secundaria" | "perigo" | "texto" | "destaque";
};

// Botões "3D pressionáveis" (mesma técnica do Duolingo): sombra sólida por
// baixo em vez de blur, some e o botão desce no :active — em vez de um
// blur genérico, parece um botão de verdade sendo apertado. "texto" fica de
// fora do tratamento 3D de propósito (é usado em contextos discretos, tipo
// linha de tabela). "destaque" usa a classe .btn-blaze (globals.css).
const VARIANTES: Record<NonNullable<BotaoProps["variante"]>, string> = {
  primaria:
    "bg-trail text-parchment-surface shadow-[0_5px_0_#1A2E20] hover:brightness-105 active:translate-y-[5px] active:shadow-none disabled:bg-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  secundaria:
    "bg-parchment-raised text-trail border-2 border-trail shadow-[0_5px_0_#33513C] hover:bg-trail-soft active:translate-y-[5px] active:shadow-none disabled:border-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  perigo:
    "bg-coral text-parchment-surface shadow-[0_5px_0_#6E2C1C] hover:brightness-105 active:translate-y-[5px] active:shadow-none disabled:bg-rule disabled:text-ink-faint disabled:shadow-none disabled:translate-y-0",
  texto: "bg-transparent text-ink-soft hover:text-ink underline-offset-4 hover:underline",
  destaque: "btn-blaze text-white disabled:animate-none disabled:bg-rule disabled:text-ink-faint",
};

const BASE = "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold tracking-wide transition-[transform,box-shadow,filter] duration-150 disabled:cursor-not-allowed";
const BASE_TEXTO = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed";

export function Botao({ variante = "primaria", className = "", ...props }: BotaoProps) {
  const base = variante === "texto" ? BASE_TEXTO : BASE;
  return <button className={`${base} ${VARIANTES[variante]} ${className}`} {...props} />;
}
