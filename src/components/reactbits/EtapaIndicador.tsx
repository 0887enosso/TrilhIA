// Indicador de etapas inspirado no Stepper do React Bits
// (https://reactbits.dev/components/stepper) — David Haz, licença MIT +
// Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
//
// Não é o componente original: o Stepper de lá gerencia o próprio estado de
// "etapa atual" internamente e espera poucos passos (tipo um wizard de 3-5
// telas com título em cada bolinha) — um módulo do TrilhIA pode ter 15+
// passos (aula + atividade de cada uma, mais a atividade final), então
// bolinhas numeradas grandes não cabem. Fica só o efeito visual (conector
// que preenche conforme avança, ponto atual em destaque) como um componente
// burro, controlado de fora pelo estado que o ModuloClient já mantém.
export function EtapaIndicador({ total, atual }: { total: number; atual: number }) {
  return (
    // `flex-wrap`: um módulo pode ter 15+ passos, e em fileira única isso
    // estoura a largura de uma tela de celular. Quebrando em linhas, o
    // indicador se adapta em vez de arrastar a página junto.
    <div
      className="flex flex-wrap items-center gap-y-1"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={atual + 1}
    >
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <span
            className={`block rounded-full transition-all duration-300 ${
              i < atual
                ? "h-2 w-2 bg-jade"
                : i === atual
                  ? "h-3 w-3 bg-amber ring-4 ring-amber-soft"
                  : "h-2 w-2 bg-rule-strong"
            }`}
          />
          {i < total - 1 ? (
            <span
              className={`mx-0.5 h-1 w-3 rounded-full transition-colors duration-300 ${
                i < atual ? "bg-jade" : "bg-rule-strong"
              }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
