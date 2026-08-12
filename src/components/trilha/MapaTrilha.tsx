import Link from "next/link";
import { Mascote } from "@/components/mascote/Mascote";
import { IconeCadeado } from "@/components/app/icones";
import type { TrilhaId } from "@/lib/content";
import type { StatusModulo } from "@/lib/progresso";

type ModuloDoMapa = {
  modulo_id: string;
  ordem: number;
  titulo: string;
  descricao_curta: string;
  tempo_estimado_min: number;
  bloco: string | null;
  status: StatusModulo;
  desbloqueado: boolean;
};

const RÓTULO_STATUS: Record<StatusModulo, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  nao_iniciado: "Não iniciado",
};

export function MapaTrilha({ trilha, modulos }: { trilha: TrilhaId; modulos: ModuloDoMapa[] }) {
  let blocoAtual: string | null = null;

  return (
    <ol className="relative flex flex-col gap-3 pl-10">
      <div
        aria-hidden="true"
        className="absolute bottom-4 left-[19px] top-4 w-1 rounded-full bg-rule"
      />
      {modulos.map((modulo) => {
        const mudaBloco = modulo.bloco && modulo.bloco !== blocoAtual;
        if (modulo.bloco) blocoAtual = modulo.bloco;
        const atual = modulo.status === "em_andamento";
        const bloqueado = !modulo.desbloqueado;

        const marcador = (
          <span
            className={`relative -left-10 flex h-10 w-10 flex-none items-center justify-center rounded-full border-[3px] font-mono text-sm font-extrabold ${
              modulo.status === "concluido"
                ? "border-trail bg-trail text-parchment-surface"
                : atual
                  ? "border-amber bg-parchment-raised text-amber-strong"
                  : "border-dashed border-rule-strong bg-parchment-raised text-ink-faint"
            }`}
          >
            {modulo.status === "concluido" ? (
              "✓"
            ) : bloqueado ? (
              <IconeCadeado className="h-4 w-4" />
            ) : (
              modulo.ordem
            )}
          </span>
        );

        const texto = (
          <span className="flex-1">
            <span className={`block font-sans text-base font-extrabold ${bloqueado ? "text-ink-faint" : "text-ink"}`}>
              {modulo.titulo}
            </span>
            <span className="block text-sm text-ink-soft">{modulo.descricao_curta}</span>
            <span className="mt-1 block font-mono text-xs font-bold text-ink-faint">
              {bloqueado ? "Bloqueado" : RÓTULO_STATUS[modulo.status]} · {modulo.tempo_estimado_min} min
            </span>
          </span>
        );

        return (
          <li key={modulo.modulo_id} className="relative">
            {mudaBloco ? (
              <p className="relative -left-10 mb-2 mt-5 font-mono text-xs font-bold uppercase tracking-wide text-ink-faint first:mt-0">
                Bloco {modulo.bloco}
              </p>
            ) : null}

            {bloqueado ? (
              <div
                title="Conclua o módulo anterior para desbloquear este."
                aria-label={`${modulo.titulo} — bloqueado. Conclua o módulo anterior para desbloquear.`}
                className="flex cursor-not-allowed items-center gap-4 rounded-2xl border-2 border-dashed border-rule bg-parchment p-4 opacity-70"
              >
                {marcador}
                {texto}
              </div>
            ) : (
              <Link
                href={`/trilha/${trilha}/${modulo.modulo_id}`}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                  atual
                    ? "border-amber bg-amber-soft shadow-[0_5px_0_#8A5B0C]"
                    : "border-rule bg-parchment-surface hover:-translate-y-0.5 hover:border-trail hover:shadow-md"
                }`}
              >
                {marcador}
                {texto}
                {atual ? <Mascote pose="andando" size={52} className="flex-none" /> : null}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
