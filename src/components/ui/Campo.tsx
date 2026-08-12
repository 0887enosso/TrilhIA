import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type CampoBaseProps = {
  rotulo: string;
  erro?: string;
  children: ReactNode;
};

function CampoBase({ rotulo, erro, children }: CampoBaseProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{rotulo}</span>
      {children}
      {erro ? <span className="text-xs text-coral">{erro}</span> : null}
    </label>
  );
}

const CAMPO_CLASSNAME =
  "rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-trail focus:outline-none focus:ring-2 focus:ring-trail-soft";

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
