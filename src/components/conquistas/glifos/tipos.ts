import type { SVGProps } from "react";

/**
 * Todo glifo é um componente de ícone puro: viewBox fixo 0 0 48 48, sem cor
 * própria (usa `currentColor`, herdado do wrapper `IconeConquista` — troca
 * de cor por tipo EMBLEMA/TROFEU acontece lá, nunca aqui).
 */
export type GlifoProps = SVGProps<SVGSVGElement>;
export type Glifo = (props: GlifoProps) => React.JSX.Element;
