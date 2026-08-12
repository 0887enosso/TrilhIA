import { Mascote } from "./Mascote";

/** Estado de carregamento com presença visual maior — antes o mascote e o texto ficavam pequenos e discretos demais. */
export function CarregandoMascote({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <Mascote pose="pensando" size={160} />
      <p className="font-sans text-lg font-extrabold text-ink">{texto}</p>
    </div>
  );
}
