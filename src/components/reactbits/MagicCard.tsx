// Adaptado do ParticleCard dentro do MagicBento do React Bits
// (https://reactbits.dev/components/magic-bento) — David Haz, licença MIT +
// Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
//
// O componente original (~850 linhas) monta um grid inteiro com 6 cards de
// conteúdo fixo em inglês, um spotlight global injetado em document.body que
// segue o mouse pela seção inteira, e tema escuro roxo hardcoded. Manter só
// a parte reutilizável: o wrapper de card com brilho de borda + partículas +
// leve inclinação 3D no hover, adaptado pra envolver QUALQUER conteúdo nosso
// (não uma grade com dado fixo) e com a cor de brilho vindo do design system
// (verde-trilha por padrão) em vez do roxo original. Sem spotlight global —
// só o brilho por cartão, mais simples e sem precisar mexer no body.
"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

const DEFAULT_PARTICLE_COUNT = 8;
const DEFAULT_GLOW_COLOR = "51, 81, 60"; // --trail em rgb

function criarParticula(x: number, y: number, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 20;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
}

type MagicCardProps = {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  particleCount?: number;
  enableTilt?: boolean;
};

export function MagicCard({
  children,
  className = "",
  glowColor = DEFAULT_GLOW_COLOR,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);

  const limparParticulas = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    particlesRef.current.forEach((p) => {
      gsap.to(p, { scale: 0, opacity: 0, duration: 0.25, onComplete: () => p.parentNode?.removeChild(p) });
    });
    particlesRef.current = [];
  }, []);

  const animarParticulas = useCallback(() => {
    const card = cardRef.current;
    if (!card || !isHoveredRef.current) return;
    const { width, height } = card.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const particula = criarParticula(Math.random() * width, Math.random() * height, glowColor);
        cardRef.current.appendChild(particula);
        particlesRef.current.push(particula);

        gsap.fromTo(particula, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
        gsap.to(particula, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          duration: 1.6 + Math.random() * 1.4,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
      }, i * 90);
      timeoutsRef.current.push(timeoutId);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onEnter = () => {
      isHoveredRef.current = true;
      animarParticulas();
      if (enableTilt) {
        gsap.to(card, { rotateX: 3, rotateY: 3, duration: 0.3, ease: "power2.out", transformPerspective: 800 });
      }
    };
    const onLeave = () => {
      isHoveredRef.current = false;
      limparParticulas();
      if (enableTilt) gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.3, ease: "power2.out" });
      card.style.setProperty("--glow-intensity", "0");
    };
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--glow-x", `${relativeX}%`);
      card.style.setProperty("--glow-y", `${relativeY}%`);
      card.style.setProperty("--glow-intensity", "1");

      if (!enableTilt) return;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gsap.to(card, {
        rotateX: ((y - centerY) / centerY) * -6,
        rotateY: ((x - centerX) / centerX) * 6,
        duration: 0.1,
        ease: "power2.out",
        transformPerspective: 800,
      });
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mouseleave", onLeave);
    card.addEventListener("mousemove", onMove);
    return () => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("mousemove", onMove);
      limparParticulas();
    };
  }, [animarParticulas, limparParticulas, enableTilt]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          "--glow-x": "50%",
          "--glow-y": "50%",
          "--glow-intensity": "0",
          background: `radial-gradient(240px circle at var(--glow-x) var(--glow-y), rgba(${glowColor}, calc(var(--glow-intensity) * 0.14)), transparent 70%)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
