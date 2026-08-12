// Adaptado de React Bits (https://reactbits.dev/animations/glare-hover) —
// David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
// `width`/`height` viraram opcionais (100%/100% por padrão) pra funcionar
// como wrapper responsivo de um card existente, em vez de uma caixa de
// tamanho fixo — o uso original assume um tamanho de demo fixo em px.
"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

type GlareHoverProps = {
  width?: string;
  height?: string;
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  glareSize?: number;
  transitionDuration?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function GlareHover({
  width = "100%",
  height = "100%",
  glareColor = "#ffffff",
  glareOpacity = 0.35,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  className = "",
  style = {},
  children,
}: GlareHoverProps) {
  const hex = glareColor.replace("#", "");
  let rgba = glareColor;
  if (/^[\dA-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const overlayRef = useRef<HTMLDivElement | null>(null);

  const animateIn = () => {
    const el = overlayRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.backgroundPosition = "-100% -100%, 0 0";
    // força o reflow antes de trocar a transição, senão o browser agrupa as duas mudanças
    void el.offsetHeight;
    el.style.transition = `${transitionDuration}ms ease`;
    el.style.backgroundPosition = "100% 100%, 0 0";
  };

  const animateOut = () => {
    const el = overlayRef.current;
    if (!el) return;
    el.style.transition = `${transitionDuration}ms ease`;
    el.style.backgroundPosition = "-100% -100%, 0 0";
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `linear-gradient(${glareAngle}deg, hsla(0,0%,0%,0) 60%, ${rgba} 70%, hsla(0,0%,0%,0) 100%)`,
    backgroundSize: `${glareSize}% ${glareSize}%, 100% 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "-100% -100%, 0 0",
    pointerEvents: "none",
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height, ...style }}
      onMouseEnter={animateIn}
      onMouseLeave={animateOut}
    >
      {children}
      <div ref={overlayRef} style={overlayStyle} />
    </div>
  );
}
