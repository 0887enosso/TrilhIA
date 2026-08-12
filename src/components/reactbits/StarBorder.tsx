// Adaptado de React Bits (https://reactbits.dev/animations/star-border) —
// David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
// Cor padrão trocada pro âmbar do produto (combina com o tema de "estrelas
// diárias"); miolo interno trocado do preto original pro parchment, senão o
// conteúdo ficava ilegível fora do tema escuro que o componente original assume.
// As keyframes `star-movement-*` estão em tailwind.config.ts.
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type StarBorderProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  innerClassName?: string;
  children?: ReactNode;
  color?: string;
  speed?: string;
  thickness?: number;
};

export function StarBorder<T extends ElementType = "div">({
  as,
  className = "",
  innerClassName = "",
  color = "#E3A63F",
  speed = "5s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = as || "div";

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-2xl ${className}`}
      {...rest}
      style={{ padding: `${thickness}px`, ...(rest as { style?: React.CSSProperties }).style }}
    >
      <div
        className="animate-star-movement-bottom absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <div
        className="animate-star-movement-top absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <div className={`relative z-[1] rounded-[15px] ${innerClassName}`}>{children}</div>
    </Component>
  );
}
