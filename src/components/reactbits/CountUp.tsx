// Adaptado de React Bits (https://reactbits.dev/text-animations/count-up) —
// David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
// Sem alterações de lógica — só formatação (mantido em pt-BR) e o tipo movido
// pra cá.
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  separator?: string;
};

export function CountUp({ to, from = 0, duration = 1.2, className = "", separator = "." }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const formatValue = useCallback(
    (latest: number) => {
      const formatted = Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Math.round(latest));
      return separator ? formatted.replace(/\./g, separator) : formatted;
    },
    [separator]
  );

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(from);
  }, [from, formatValue]);

  useEffect(() => {
    if (isInView) motionValue.set(to);
  }, [isInView, motionValue, to]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
