// Adaptado de React Bits (https://reactbits.dev/text-animations/decrypted-text)
// — David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
// Simplificado: só o modo `animateOn="view"` (decodifica uma vez quando
// aparece na tela) foi mantido — os modos hover/click do original tocariam
// de novo toda vez que o mouse passasse por cima, o que cansa rápido em uma
// tela que se vê todo dia (login). Usar com moderação: um heading por tela,
// no máximo, nunca em texto de leitura corrida.
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

type DecryptedTextProps = {
  text: string;
  speed?: number;
  className?: string;
  encryptedClassName?: string;
};

export function DecryptedText({ text, speed = 35, className = "", encryptedClassName = "" }: DecryptedTextProps) {
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [displayText, setDisplayText] = useState(text);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const shuffle = useCallback(
    (revealed: Set<number>) =>
      text
        .split("")
        .map((char, i) => (char === " " || revealed.has(i) ? char : CARACTERES[Math.floor(Math.random() * CARACTERES.length)]))
        .join(""),
    [text]
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text);
      setDone(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;

        let revealed = new Set<number>();
        const interval = setInterval(() => {
          revealed = new Set(revealed);
          revealed.add(revealed.size);
          setRevealedIndices(revealed);
          setDisplayText(shuffle(revealed));
          if (revealed.size >= text.length) {
            clearInterval(interval);
            setDisplayText(text);
            setDone(true);
          }
        }, speed);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  const spans = useMemo(
    () =>
      displayText.split("").map((char, i) => (
        <span key={i} className={done || revealedIndices.has(i) ? className : encryptedClassName}>
          {char}
        </span>
      )),
    [displayText, done, revealedIndices, className, encryptedClassName]
  );

  return (
    <span ref={ref} className="inline-block whitespace-pre-wrap" aria-label={text}>
      {spans}
    </span>
  );
}
