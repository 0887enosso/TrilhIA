// Adaptado de React Bits (https://reactbits.dev/animations/noise) — David Haz,
// licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md). Ajustes:
// alpha bem mais baixo (grão quase imperceptível, é textura de fundo, não
// efeito) e `fixed inset-0` em vez de w/h fixos em viewport units, pra
// funcionar como camada de fundo do app inteiro (renderizado uma vez no
// layout raiz, junto com TrilhaBackdrop).
"use client";

import { useEffect, useRef } from "react";

type NoiseProps = {
  patternAlpha?: number;
  patternRefreshInterval?: number;
  className?: string;
};

export function Noise({ patternAlpha = 6, patternRefreshInterval = 6, className = "" }: NoiseProps) {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId: number;
    const canvasSize = 256;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % patternRefreshInterval === 0) drawGrain();
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };
    loop();

    return () => window.cancelAnimationFrame(animationId);
  }, [patternAlpha, patternRefreshInterval]);

  return (
    <canvas
      ref={grainRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 h-full w-full print:hidden ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
