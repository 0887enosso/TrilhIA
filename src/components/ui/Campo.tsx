import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type CampoBaseProps = {
  rotulo: string;
  erro?: string;
  children: ReactNode;
};

function CampoBase({ rotulo, erro, children }: CampoBaseProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-ink-soft">{rotulo}</span>
      {children}
      {erro ? <span className="text-xs font-semibold text-coral">{erro}</span> : null}
    </label>
  );
}

// Campos com o mesmo peso visual dos botões: borda de 2px e raio grande, em
// vez da borda de 1px com raio de 6px que usavam antes — ao lado de um botão
// 3px/22px eles pareciam de outro sistema de design. O fundo rebaixado
// (`parchment-deep`) e a sombra interna fazem o campo parecer cavado na
// página; ao focar, ele "sobe" para branco com anel verde.
const CAMPO_CLASSNAME =
  "w-full rounded-xl border-2 border-rule bg-parchment-deep px-4 py-3 text-sm font-semibold text-ink shadow-well transition-[background-color,border-color,box-shadow] placeholder:font-normal placeholder:text-ink-faint focus:border-jade focus:bg-parchment-raised focus:shadow-none focus:outline-none focus:ring-4 focus:ring-jade-soft disabled:opacity-60";

type CampoTextoProps = InputHTMLAttributes<HTMLInputElement> & { rotulo: string; erro?: string };

export function CampoTexto({ rotulo, erro, className = "", ...props }: CampoTextoProps) {
  return (
    <CampoBase rotulo={rotulo} erro={erro}>
      <input className={`${CAMPO_CLASSNAME} ${className}`} {...props} />
    </CampoBase>
  );
}

type CampoSelecaoProps = SelectHTMLAttributes<HTMLSelectElement> & {
  rotulo: string;
  erro?: string;
  children: ReactNode;
};

export function CampoSelecao({ rotulo, erro, className = "", children, ...props }: CampoSelecaoProps) {
  return (
    <CampoBase rotulo={rotulo} erro={erro}>
      <select className={`${CAMPO_CLASSNAME} ${className}`} {...props}>
        {children}
      </select>
    </CampoBase>
  );
}

/** Mesma pele dos campos acima, para uso solto (textarea do quiz, selects do
 *  CartaoQuestao) sem o rótulo/erro do CampoBase. */
export const PELE_CAMPO = CAMPO_CLASSNAME;
