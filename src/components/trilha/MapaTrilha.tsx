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

/**
 * Deslocamento horizontal de cada nó, em px, ciclando para formar uma trilha
 * que serpenteia. Antes desta rodada o mapa era uma lista vertical com um
 * trilho reto à esquerda — funcionava, mas não era um MAPA, e o mapa é
 * justamente a metáfora central do produto (trilha + mascote explorador).
 *
 * O ciclo tem 8 posições e é simétrico (sobe até +2, volta, desce até -2,
 * volta), então a costura entre uma volta e a seguinte não dá salto.
 */
const DESLOCAMENTOS = [0, 56, 88, 56, 0, -56, -88, -56];

function deslocamentoDe(indice: number): number {
  return DESLOCAMENTOS[indice % DESLOCAMENTOS.length];
}

/** Três pontinhos interpolados entre um nó e o seguinte — dão a leitura de
 *  caminho curvo sem precisar calcular geometria de curva de verdade. */
function TrechoDeTrilha({ de, para }: { de: number; para: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-1.5 py-1">
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <span
          key={t}
          className="desloca-trilha h-2.5 w-2.5 rounded-full bg-ink-faint/60"
          style={{ "--desloc": de + (para - de) * t } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function No({ modulo }: { modulo: ModuloDoMapa }) {
  const bloqueado = !modulo.desbloqueado;
  const concluido = modulo.status === "concluido";
  const atual = modulo.status === "em_andamento";

  if (concluido) {
    return (
      <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full border-4 border-jade-strong bg-jade shadow-press-jade">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
          <path
            d="m5.5 12.5 4.2 4.2L18.5 7.8"
            stroke="#FFFCF2"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (bloqueado) {
    return (
      <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full border-4 border-dashed border-rule-strong bg-parchment text-ink-faint">
        <IconeCadeado className="h-6 w-6" />
      </span>
    );
  }

  return (
    <span
      className={`font-variant-tabular flex h-16 w-16 flex-none items-center justify-center rounded-full border-4 text-xl font-extrabold transition-transform group-hover:-translate-y-1 ${
        atual
          ? "border-amber-strong bg-amber-vivid text-ink shadow-press-amber"
          : "border-rule-strong bg-parchment-raised text-ink-soft shadow-press-rule"
      }`}
    >
      {modulo.ordem}
    </span>
  );
}

export function MapaTrilha({ trilha, modulos }: { trilha: TrilhaId; modulos: ModuloDoMapa[] }) {
  let blocoAtual: string | null = null;

  return (
    <ol className="flex flex-col items-center">
      {modulos.map((modulo, indice) => {
        const mudaBloco = modulo.bloco && modulo.bloco !== blocoAtual;
        if (modulo.bloco) blocoAtual = modulo.bloco;

        const bloqueado = !modulo.desbloqueado;
        const atual = modulo.status === "em_andamento";
        const deslocamento = deslocamentoDe(indice);
        const proximo = modulos[indice + 1];

        const conteudo = (
          <>
            <No modulo={modulo} />
            <span className="mt-2 block max-w-[15rem] text-center">
              <span
                className={`block text-sm font-extrabold leading-tight ${
                  bloqueado ? "text-ink-soft" : "text-ink"
                }`}
              >
                {modulo.titulo}
              </span>
              {atual ? (
                <>
                  <span className="mt-1 block text-xs leading-snug text-ink-soft">
                    {modulo.descricao_curta}
                  </span>
                  <span className="font-variant-tabular mt-1.5 inline-block rounded-full bg-amber-soft px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-strong">
                    Continuar · {modulo.tempo_estimado_min} min
                  </span>
                </>
              ) : null}
            </span>
          </>
        );

        return (
          <li key={modulo.modulo_id} className="flex w-full flex-col items-center">
            {mudaBloco ? (
              <div className="my-6 flex w-full items-center gap-3">
                <span className="h-0.5 flex-1 rounded-full bg-rule" />
                <span className="rounded-full border-2 border-rule bg-parchment-surface px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-ink-soft">
                  Bloco {modulo.bloco}
                </span>
                <span className="h-0.5 flex-1 rounded-full bg-rule" />
              </div>
            ) : null}

            <div
              className="desloca-trilha relative flex flex-col items-center"
              style={{ "--desloc": deslocamento } as React.CSSProperties}
            >
              {/* O mascote marca onde o usuário parou — é o "você está aqui"
                  do mapa. Posicionado ao lado do nó, não sobre ele, pra não
                  cobrir o número nem o selo de concluído. */}
              {atual ? (
                <span className="pointer-events-none absolute -left-[4.5rem] bottom-6 hidden animate-flutuar sm:block">
                  <Mascote pose="andando" size={72} />
                </span>
              ) : null}

              {bloqueado ? (
                <div
                  title="Conclua o módulo anterior para desbloquear este."
                  aria-label={`${modulo.titulo} — bloqueado. Conclua o módulo anterior para desbloquear.`}
                  /* Sem `opacity`: o estado bloqueado já é dito pelo cadeado, pela
                     borda tracejada e pela cor mais fraca do título. Empilhar
                     opacidade sobre uma cor que já é clara deixava o título
                     ilegível no mapa (era o defeito mais visível da captura). */
                  className="flex cursor-not-allowed flex-col items-center"
                >
                  {conteudo}
                </div>
              ) : (
                <Link
                  href={`/trilha/${trilha}/${modulo.modulo_id}`}
                  className="group flex flex-col items-center rounded-2xl px-2 py-1 transition-colors"
                >
                  {conteudo}
                </Link>
              )}
            </div>

            {proximo ? (
              <TrechoDeTrilha de={deslocamento} para={deslocamentoDe(indice + 1)} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
