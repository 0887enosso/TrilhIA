/** Peças reaproveitadas entre vários glifos — reduz repetição de path data. */

/** Sparkle/brilho de 4 pontas — usado nos troféus para sugerir "ouro reluzente" sem precisar de render 3D. */
export function Brilho({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0,-4 L1.1,-1.1 L4,0 L1.1,1.1 L0,4 L-1.1,1.1 L-4,0 L-1.1,-1.1 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill="currentColor"
    />
  );
}

/** Silhueta de chama — base do "foguinho" reutilizada em vários emblemas/troféus de Engajamento. */
export const CAMINHO_CHAMA =
  "M24 8c1 4.5 3.6 7 6.4 10.4 3 3.6 5.1 7.4 5.1 11.6 0 7.6-6.3 13.5-13.9 12.9-6.7-.5-11.6-6-11.6-12.6 0-4 1.8-6.8 3.8-9.6 1.4-2 2.6-3.7 2.9-6 .6 2 2 3.4 3.5 4.9 1.9-3.7 3-7.2 3.8-11.6Z";

export function Chama(props: { transform?: string }) {
  return <path d={CAMINHO_CHAMA} transform={props.transform} />;
}
