import { SVGProps } from "react";

// Ícones de linha simples (sem lib externa) para a sidebar — viewBox e
// stroke consistentes entre todos, pra formarem um conjunto coeso.
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function IconeInicio(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </Base>
  );
}

export function IconeTrilha(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 20c3-6 3-10 0-16" />
      <path d="M20 20c-3-6-3-10 0-16" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="12" cy="13" r="2.2" />
      <circle cx="12" cy="20" r="2.2" />
    </Base>
  );
}

export function IconeRaio(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props} strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </Base>
  );
}

export function IconeMedalha(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="14" r="6" />
      <path d="m9 3 3 5 3-5M8.5 8 6 3M15.5 8 18 3" />
      <path d="m10 14 1.4 1.4L14.5 12" />
    </Base>
  );
}

export function IconeTrofeu(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 .8-3 2.5-3s2.5 1 2.5 3" />
    </Base>
  );
}

export function IconeFerramenta(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L5 16l3-3 4.9-4.9a3.5 3.5 0 0 1 1.6-1.6Z" />
      <path d="m14 9 4.5-4.5 2 2L16 11" />
      <path d="m5 16-1.5 3.5L7 18" />
    </Base>
  );
}

export function IconeSair(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 8l5 4-5 4M19 12H9" />
    </Base>
  );
}

export function IconeSeta(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 6l6 6-6 6" />
    </Base>
  );
}

export function IconeBussola(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" strokeLinejoin="round" />
      <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21" />
    </Base>
  );
}

export function IconeCadeado(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  );
}
