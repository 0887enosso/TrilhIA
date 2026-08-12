import { ReactNode } from "react";

const CORES = {
  amber: "bg-amber-soft text-amber-strong",
  trail: "bg-trail-soft text-trail-strong",
  coral: "bg-coral-soft text-coral",
} as const;

export function BadgePill({
  children,
  cor = "amber",
}: {
  children: ReactNode;
  cor?: keyof typeof CORES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wide ${CORES[cor]}`}
    >
      {children}
    </span>
  );
}
