// Adaptado de React Bits (https://reactbits.dev/animations/click-spark) —
// David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
// Cor padrão (âmbar do produto), menos faíscas por padrão (6 em vez de 8 —
// mais discreto, é feedback, não fogo de artifício) e o loop de desenho só
// roda enquanto houver faíscas ativas (evita `requestAnimationFrame`
// permanente a 60fps sem nada para desenhar).
"use client";

import { useCallback, useEffect, useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";

type Spark = { x: number; y: number; angle: number; startTime: number };

type ClickSparkProps = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  className?: string;
  children?: ReactNode;
};

export function ClickSpark({
  sparkColor = "#A9700F",
  sparkSize = 9,
  sparkRadius = 16,
  sparkCount = 6,
  duration = 380,
  className = "",
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);
    resizeCanvas();

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const easeOut = useCallback((t: number) => t * (2 - t), []);

  // Desenha um frame e, se ainda restarem faíscas, agenda o próximo — do
  // contrário para o loop (o próximo clique é quem o reinicia).
  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        animationIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = easeOut(progress);
        const distance = eased * sparkRadius;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });

      if (sparksRef.current.length === 0) {
        animationIdRef.current = null;
        return;
      }

      animationIdRef.current = requestAnimationFrame(draw);
    },
    [sparkColor, sparkSize, sparkRadius, duration, easeOut]
  );

  // Garante que o loop pare quando o componente desmonta (ex.: navegação
  // entre módulos) mesmo que ainda houvesse faíscas em andamento.
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    };
  }, [draw]);

  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const wasIdle = sparksRef.current.length === 0 && animationIdRef.current === null;

    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }))
    );

    if (wasIdle) {
      animationIdRef.current = requestAnimationFrame(draw);
    }
  };

  return (
    <div className={`relative ${className}`} onClick={handleClick}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}
