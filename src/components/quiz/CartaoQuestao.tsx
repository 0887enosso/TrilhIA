"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { ClickSpark } from "@/components/reactbits/ClickSpark";
import type { ExplicacaoAutoavaliada, Questao, ResultadoResposta } from "./tipos";

type CartaoQuestaoProps = {
  questao: Questao;
  onResponder: (resposta: unknown) => Promise<ResultadoResposta>;
  onContinuar: () => void;
};

const OPCAO_CLASSNAME =
  "w-full rounded-md border px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed";

function classeOpcao(ativo: boolean) {
  return `${OPCAO_CLASSNAME} ${
    ativo ? "border-trail bg-trail-soft text-trail-strong" : "border-rule bg-parchment-raised text-ink hover:border-trail"
  }`;
}

export function CartaoQuestao({ questao, onResponder, onContinuar }: CartaoQuestaoProps) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoResposta | null>(null);

  // Estado de resposta — só o relevante para o tipo da questão é usado.
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [lacunas, setLacunas] = useState<Record<number, string>>({});
  const [pares, setPares] = useState<Record<string, string>>({});
  const [ordem, setOrdem] = useState<string[]>(
    questao.tipo === "ordenar_etapas" ? [...questao.etapas_embaralhadas] : []
  );
  const [texto, setTexto] = useState("");

  function limparSelecao() {
    setSelecionado(null);
    setLacunas({});
    setPares({});
    if (questao.tipo === "ordenar_etapas") setOrdem([...questao.etapas_embaralhadas]);
    setTexto("");
  }

  function montarPayload(): unknown {
    switch (questao.tipo) {
      case "multipla_escolha":
      case "correcao_prompt":
        return { alternativaId: selecionado };
      case "verdadeiro_falso":
        return { justificativaId: selecionado };
      case "completar_lacuna":
        return {
          respostas: questao.lacunas.map((l) => ({ posicao: l.posicao, valor: lacunas[l.posicao] ?? "" })),
        };
      case "associacao":
        return {
          pares: questao.termos.map((termo) => ({ termo, definicaoEscolhida: pares[termo] ?? "" })),
        };
      case "ordenar_etapas":
        return { ordem };
      case "resposta_curta_autoavaliada":
        return { texto };
    }
  }

  function respostaCompleta(): boolean {
    switch (questao.tipo) {
      case "multipla_escolha":
      case "correcao_prompt":
      case "verdadeiro_falso":
        return selecionado !== null;
      case "completar_lacuna":
        return questao.lacunas.every((l) => lacunas[l.posicao]);
      case "associacao":
        return questao.termos.every((t) => pares[t]);
      case "ordenar_etapas":
        return ordem.length === questao.etapas_embaralhadas.length;
      case "resposta_curta_autoavaliada":
        return texto.trim().length > 0;
    }
  }

  async function enviar() {
    setEnviando(true);
    const resultadoResposta = await onResponder(montarPayload());
    setResultado(resultadoResposta);
    setEnviando(false);
  }

  function tentarNovamente() {
    setResultado(null);
    limparSelecao();
  }

  const jaRespondida = resultado !== null;
  const acertou = resultado?.correta === true || resultado?.correta === null;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border-2 border-rule bg-parchment-surface p-6">
      {questao.tipo === "multipla_escolha" || questao.tipo === "correcao_prompt" ? (
        <>
          {questao.prompt_analisado ? (
            <pre className="whitespace-pre-wrap rounded-md border border-rule bg-parchment p-3 font-mono text-xs text-ink-soft">
              {questao.prompt_analisado}
            </pre>
          ) : null}
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <div className="flex flex-col gap-2">
            {questao.alternativas.map((alt) => (
              <button
                key={alt.id}
                type="button"
                disabled={jaRespondida}
                onClick={() => setSelecionado(alt.id)}
                className={classeOpcao(selecionado === alt.id)}
              >
                {alt.texto}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {questao.tipo === "verdadeiro_falso" ? (
        <>
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <div className="flex flex-col gap-2">
            {questao.justificativas.map((just) => (
              <button
                key={just.id}
                type="button"
                disabled={jaRespondida}
                onClick={() => setSelecionado(just.id)}
                className={classeOpcao(selecionado === just.id)}
              >
                {just.texto}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {questao.tipo === "completar_lacuna" ? (
        <>
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <div className="flex flex-col gap-3">
            {questao.lacunas.map((lacuna) => (
              <label key={lacuna.posicao} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Lacuna {lacuna.posicao}</span>
                <select
                  disabled={jaRespondida}
                  value={lacunas[lacuna.posicao] ?? ""}
                  onChange={(e) => setLacunas((prev) => ({ ...prev, [lacuna.posicao]: e.target.value }))}
                  className="rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink focus:border-trail focus:outline-none"
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {lacuna.opcoes.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {questao.tipo === "associacao" ? (
        <>
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <div className="flex flex-col gap-3">
            {questao.termos.map((termo) => (
              <label key={termo} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium text-ink sm:w-40">{termo}</span>
                <select
                  disabled={jaRespondida}
                  value={pares[termo] ?? ""}
                  onChange={(e) => setPares((prev) => ({ ...prev, [termo]: e.target.value }))}
                  className="flex-1 rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink focus:border-trail focus:outline-none"
                >
                  <option value="" disabled>
                    Selecione a definição
                  </option>
                  {questao.definicoes.map((definicao) => (
                    <option key={definicao} value={definicao}>
                      {definicao}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {questao.tipo === "ordenar_etapas" ? (
        <>
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <ol className="flex flex-col gap-2">
            {ordem.map((etapa, indice) => (
              <li
                key={etapa}
                className="flex items-center gap-3 rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink"
              >
                <span className="font-mono text-xs text-ink-faint">{indice + 1}</span>
                <span className="flex-1">{etapa}</span>
                {!jaRespondida ? (
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Mover para cima"
                      disabled={indice === 0}
                      onClick={() =>
                        setOrdem((prev) => {
                          const copia = [...prev];
                          [copia[indice - 1], copia[indice]] = [copia[indice], copia[indice - 1]];
                          return copia;
                        })
                      }
                      className="rounded border border-rule px-2 py-0.5 text-ink-soft hover:border-trail disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Mover para baixo"
                      disabled={indice === ordem.length - 1}
                      onClick={() =>
                        setOrdem((prev) => {
                          const copia = [...prev];
                          [copia[indice], copia[indice + 1]] = [copia[indice + 1], copia[indice]];
                          return copia;
                        })
                      }
                      className="rounded border border-rule px-2 py-0.5 text-ink-soft hover:border-trail disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {questao.tipo === "resposta_curta_autoavaliada" ? (
        <>
          <p className="font-display text-lg text-ink">{questao.enunciado}</p>
          <textarea
            disabled={jaRespondida}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder="Escreva sua resposta…"
            className="rounded-md border border-rule bg-parchment-raised px-3 py-2 text-sm text-ink focus:border-trail focus:outline-none disabled:opacity-70"
          />
        </>
      ) : null}

      {!jaRespondida ? (
        <ClickSpark className="inline-block self-start" sparkColor="#A9700F">
          <Botao onClick={enviar} disabled={enviando || !respostaCompleta()}>
            {enviando ? "Enviando…" : "Responder"}
          </Botao>
        </ClickSpark>
      ) : (
        <div
          className={`flex flex-col gap-3 rounded-md p-4 ${
            acertou ? "bg-trail-soft text-trail-strong" : "bg-coral-soft text-coral"
          }`}
          role="status"
        >
          <p className="font-semibold">
            {resultado?.correta === true
              ? `Certo! +${resultado.xpGanho} XP`
              : resultado?.correta === false
                ? "Não foi dessa vez."
                : "Resposta registrada."}
          </p>

          {typeof resultado?.explicacao === "string" ? (
            <p className="text-sm text-ink">{resultado.explicacao}</p>
          ) : null}

          {resultado?.explicacao && typeof resultado.explicacao === "object" ? (
            <div className="flex flex-col gap-2 text-sm text-ink">
              <div>
                <p className="font-semibold">Critérios de autoavaliação</p>
                <ul className="list-inside list-disc">
                  {(resultado.explicacao as ExplicacaoAutoavaliada).criterios_autoavaliacao.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Exemplo de resposta forte</p>
                <p className="text-ink-soft">
                  {(resultado.explicacao as ExplicacaoAutoavaliada).exemplo_de_resposta_forte}
                </p>
              </div>
            </div>
          ) : null}

          <Botao onClick={acertou ? onContinuar : tentarNovamente} className="self-start">
            {acertou ? "Continuar" : "Tentar novamente"}
          </Botao>
        </div>
      )}
    </div>
  );
}
