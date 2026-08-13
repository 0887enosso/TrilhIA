"use client";

import { useState } from "react";
import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";
import type { TrilhaId } from "@/lib/content";

type Caso = { caso_id: string; titulo: string; dossie: string; tarefas: string[] };

type ConteudoProjetoFinal = {
  titulo: string;
  instrucoes: string;
  casos: Caso[];
  checklist_autoavaliacao: string[];
};

type EntregaExistente = {
  casoId: string;
  respostasTarefas: string[];
  checklistMarcado: boolean[];
} | null;

export function ProjetoFinalFlow({
  conteudo,
  entregaExistente,
  onConcluido,
}: {
  trilha: TrilhaId;
  conteudo: Record<string, unknown>;
  entregaExistente?: EntregaExistente;
  onConcluido: () => void;
}) {
  const dados = conteudo as unknown as ConteudoProjetoFinal;
  const casoDaEntregaExistente = entregaExistente
    ? dados.casos.find((c) => c.caso_id === entregaExistente.casoId) ?? null
    : null;

  const [casoId, setCasoId] = useState<string | null>(casoDaEntregaExistente?.caso_id ?? null);
  // Se já existe uma entrega salva para este caso, retoma com o que foi
  // enviado da última vez em vez de recomeçar em branco — só usa o valor
  // salvo se a quantidade de tarefas ainda bate com o conteúdo atual (se o
  // caso mudou de tamanho depois da entrega, um conteúdo desatualizado é
  // mais seguro que um array de respostas fora de ordem).
  const [respostas, setRespostas] = useState<string[]>(() => {
    if (
      casoDaEntregaExistente &&
      entregaExistente &&
      entregaExistente.respostasTarefas.length === casoDaEntregaExistente.tarefas.length
    ) {
      return entregaExistente.respostasTarefas;
    }
    return casoDaEntregaExistente ? new Array(casoDaEntregaExistente.tarefas.length).fill("") : [];
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    if (
      entregaExistente &&
      entregaExistente.checklistMarcado.length === dados.checklist_autoavaliacao.length
    ) {
      return entregaExistente.checklistMarcado;
    }
    return new Array(dados.checklist_autoavaliacao.length).fill(false);
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const caso = dados.casos.find((c) => c.caso_id === casoId) ?? null;

  function escolherCaso(novoCaso: Caso) {
    setCasoId(novoCaso.caso_id);
    setRespostas(new Array(novoCaso.tarefas.length).fill(""));
    setChecklist(new Array(dados.checklist_autoavaliacao.length).fill(false));
  }

  // Trocar de caso depois de já ter escolhido um descarta o que foi digitado
  // (e, se havia uma entrega enviada antes para o caso atual, ela é
  // sobrescrita na hora de enviar de novo) — antes isso acontecia sem
  // nenhum aviso; agora exige confirmação explícita.
  function pedirTrocaDeCaso() {
    const confirmado = window.confirm(
      "Trocar de caso agora descarta as respostas deste caso (inclusive a entrega já enviada, se houver). Quer continuar?"
    );
    if (!confirmado) return;
    setCasoId(null);
    setRespostas([]);
    setChecklist(new Array(dados.checklist_autoavaliacao.length).fill(false));
    setErro(null);
  }

  async function enviar() {
    if (!caso) return;
    setEnviando(true);
    setErro(null);

    const res = await fetch("/api/progresso/projeto-final", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ casoId: caso.caso_id, respostasTarefas: respostas, checklistMarcado: checklist }),
    });
    const corpo = await res.json();

    if (!res.ok) {
      setErro(corpo.erro ?? "Não foi possível registrar a entrega.");
      setEnviando(false);
      return;
    }

    onConcluido();
  }

  const respostasCompletas = respostas.length > 0 && respostas.every((r) => r.trim().length > 0);

  if (!caso) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 rounded-lg border border-rule bg-parchment-surface p-6">
          <Mascote pose="pensando" size={90} />
          <div>
            <h1 className="font-display text-xl text-ink">{dados.titulo}</h1>
            <p className="mt-1 text-sm text-ink-soft">{dados.instrucoes}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {dados.casos.map((c) => (
            <button
              key={c.caso_id}
              type="button"
              onClick={() => escolherCaso(c)}
              className="flex flex-col gap-2 rounded-lg border border-rule bg-parchment-surface p-5 text-left transition-colors hover:border-trail"
            >
              <h3 className="font-display text-base text-ink">{c.titulo}</h3>
              <p className="text-sm text-ink-soft">{c.dossie}</p>
              <span className="mt-auto font-mono text-xs text-trail">{c.tarefas.length} tarefas →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-rule bg-parchment-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl text-ink">{caso.titulo}</h1>
            <p className="mt-2 text-sm text-ink-soft">{caso.dossie}</p>
          </div>
          <button
            type="button"
            onClick={pedirTrocaDeCaso}
            className="shrink-0 text-xs text-ink-faint underline hover:text-ink-soft"
          >
            Trocar de caso
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {caso.tarefas.map((tarefa, indice) => (
          <div key={indice} className="rounded-lg border border-rule bg-parchment-surface p-5">
            <p className="mb-2 text-sm font-medium text-ink">
              {indice + 1}. {tarefa}
            </p>
            <textarea
              rows={4}
              value={respostas[indice] ?? ""}
              onChange={(e) =>
                setRespostas((prev) => prev.map((r, i) => (i === indice ? e.target.value : r)))
              }
              placeholder="Sua resposta…"
              className="w-full rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink focus:border-trail focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-rule bg-parchment-surface p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Autoavaliação</h2>
        <div className="flex flex-col gap-2">
          {dados.checklist_autoavaliacao.map((item, indice) => (
            <label key={indice} className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={checklist[indice] ?? false}
                onChange={(e) =>
                  setChecklist((prev) => prev.map((v, i) => (i === indice ? e.target.checked : v)))
                }
                className="mt-0.5"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {erro ? (
        <p className="rounded-md bg-coral-soft px-3 py-2 text-sm text-coral" role="alert">
          {erro}
        </p>
      ) : null}

      <Botao onClick={enviar} disabled={!respostasCompletas || enviando} className="self-start">
        {enviando ? "Enviando…" : "Concluir projeto final"}
      </Botao>
    </div>
  );
}
