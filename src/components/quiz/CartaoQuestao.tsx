"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { PELE_CAMPO } from "@/components/ui/Campo";
import { ClickSpark } from "@/components/reactbits/ClickSpark";
import { PrecarregarPoses } from "@/components/mascote/Mascote";
import { BarraFeedback } from "./BarraFeedback";
import type { ExplicacaoAutoavaliada, Questao, ResultadoResposta } from "./tipos";

type CartaoQuestaoProps = {
  questao: Questao;
  onResponder: (resposta: unknown) => Promise<ResultadoResposta>;
  onContinuar: () => void;
  // Definido quando existe alguma aula antes dessa questão no módulo — para
  // questões ligadas diretamente a uma aula, é ela mesma; para questões de
  // atividade_final (sem aula própria), é a última aula ensinada no módulo
  // (ver questaoIndiceParaAulaIndice em ModuloClient.tsx). Só fica null no
  // caso raro de a questão não ter NENHUMA aula antes dela — aí o
  // comportamento de erro cai de volta para "Tentar novamente" na mesma
  // pergunta.
  aoErrarVoltarParaAula?: (() => void) | null;
};

/**
 * Alternativas como "tiles" pressionáveis, com a mesma borda inferior sólida
 * dos botões (ver Botao.tsx). Antes eram retângulos de borda 1px e raio de
 * 6px, sem reação ao toque — o elemento mais clicado do app inteiro era o
 * mais apagado dele, e nada indicava que era clicável antes do hover.
 */
function classeTile({
  ativo,
  respondida,
  resultado,
}: {
  ativo: boolean;
  respondida: boolean;
  resultado: "acerto" | "erro" | null;
}) {
  const base =
    "w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-semibold transition-all duration-100 disabled:cursor-not-allowed";

  // Depois de responder, a alternativa escolhida ganha a cor do resultado; as
  // demais apagam. O gabarito NUNCA é revelado aqui — a API manda só se a
  // resposta enviada estava certa (ver sanitizarQuestaoParaCliente), porque o
  // usuário pode tentar de novo.
  if (respondida) {
    if (resultado === "acerto") {
      return `${base} border-jade bg-jade text-parchment-surface shadow-press-jade`;
    }
    if (resultado === "erro") {
      return `${base} border-coral bg-coral text-parchment-surface shadow-press-coral`;
    }
    return `${base} border-rule bg-parchment opacity-50`;
  }

  if (ativo) {
    return `${base} border-jade bg-jade-soft text-jade-strong shadow-press-jade`;
  }

  return `${base} border-rule bg-parchment-raised text-ink shadow-press-rule hover:-translate-y-0.5 hover:border-jade active:translate-y-[4px] active:shadow-none`;
}

export function CartaoQuestao({ questao, onResponder, onContinuar, aoErrarVoltarParaAula }: CartaoQuestaoProps) {
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
  // Só oferece "Revisar aula" quando existe alguma aula antes dessa questão
  // (aoErrarVoltarParaAula não é null) — na prática isso cobre quase sempre,
  // inclusive atividade_final (volta pra última aula do módulo). Só cai no
  // fallback de tentar de novo na mesma pergunta se não existir nenhuma aula
  // antes dela. resposta_curta_autoavaliada nunca cai aqui: seu resultado é
  // sempre `correta === null`, nunca `false`.
  const errouComRevisao = resultado?.correta === false && !!aoErrarVoltarParaAula;

  /** Resultado a aplicar num tile de escolha única, pelo id da opção. */
  function resultadoDoTile(id: string): "acerto" | "erro" | null {
    if (!jaRespondida || selecionado !== id) return null;
    if (resultado?.correta === false) return "erro";
    return "acerto";
  }

  const enunciado = <p className="font-display text-xl leading-relaxed text-ink">{questao.enunciado}</p>;

  return (
    <>
      {/* Baixa as poses de reação enquanto a questão está na tela, pra que a
          barra de feedback já encontre a imagem em cache quando montar. */}
      {resultado ? null : <PrecarregarPoses />}

      <div className="flex flex-col gap-5 rounded-3xl border-2 border-rule bg-parchment-surface p-6 shadow-lift">
        {questao.tipo === "multipla_escolha" || questao.tipo === "correcao_prompt" ? (
          <>
            {questao.prompt_analisado ? (
              <pre className="whitespace-pre-wrap rounded-xl border-2 border-rule bg-parchment-deep p-4 font-mono text-xs leading-relaxed text-ink-soft shadow-well">
                {questao.prompt_analisado}
              </pre>
            ) : null}
            {enunciado}
            <div className="flex flex-col gap-2.5">
              {questao.alternativas.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  disabled={jaRespondida}
                  onClick={() => setSelecionado(alt.id)}
                  className={classeTile({
                    ativo: selecionado === alt.id,
                    respondida: jaRespondida,
                    resultado: resultadoDoTile(alt.id),
                  })}
                >
                  {alt.texto}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {questao.tipo === "verdadeiro_falso" ? (
          <>
            {enunciado}
            <div className="flex flex-col gap-2.5">
              {questao.justificativas.map((just) => (
                <button
                  key={just.id}
                  type="button"
                  disabled={jaRespondida}
                  onClick={() => setSelecionado(just.id)}
                  className={classeTile({
                    ativo: selecionado === just.id,
                    respondida: jaRespondida,
                    resultado: resultadoDoTile(just.id),
                  })}
                >
                  {just.texto}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {questao.tipo === "completar_lacuna" ? (
          <>
            {enunciado}
            <div className="flex flex-col gap-3">
              {questao.lacunas.map((lacuna) => (
                <label key={lacuna.posicao} className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-ink-soft">Lacuna {lacuna.posicao}</span>
                  <select
                    disabled={jaRespondida}
                    value={lacunas[lacuna.posicao] ?? ""}
                    onChange={(e) => setLacunas((prev) => ({ ...prev, [lacuna.posicao]: e.target.value }))}
                    className={PELE_CAMPO}
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
            {enunciado}
            <div className="flex flex-col gap-2.5">
              {questao.termos.map((termo) => (
                <label
                  key={termo}
                  className="flex flex-col gap-2 rounded-xl border-2 border-rule bg-parchment-raised p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="text-sm font-extrabold text-ink sm:w-44">{termo}</span>
                  <select
                    disabled={jaRespondida}
                    value={pares[termo] ?? ""}
                    onChange={(e) => setPares((prev) => ({ ...prev, [termo]: e.target.value }))}
                    className={`${PELE_CAMPO} flex-1`}
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
            {enunciado}
            <ol className="flex flex-col gap-2.5">
              {ordem.map((etapa, indice) => (
                <li
                  key={etapa}
                  className="flex items-center gap-3 rounded-xl border-2 border-rule bg-parchment-raised px-3 py-3 text-sm font-semibold text-ink shadow-press-rule"
                >
                  <span className="font-variant-tabular flex h-7 w-7 flex-none items-center justify-center rounded-full bg-trail text-xs font-extrabold text-parchment-surface">
                    {indice + 1}
                  </span>
                  <span className="flex-1">{etapa}</span>
                  {!jaRespondida ? (
                    <span className="flex flex-none gap-1">
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-rule bg-parchment text-ink-soft transition-colors hover:border-jade hover:text-jade-strong disabled:opacity-30 disabled:hover:border-rule"
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
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-rule bg-parchment text-ink-soft transition-colors hover:border-jade hover:text-jade-strong disabled:opacity-30 disabled:hover:border-rule"
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
            {enunciado}
            <textarea
              disabled={jaRespondida}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              placeholder="Escreva sua resposta…"
              className={`${PELE_CAMPO} resize-y leading-relaxed`}
            />
          </>
        ) : null}

        {!jaRespondida ? (
          <ClickSpark className="inline-block self-start" sparkColor="#F0B03C">
            <Botao onClick={enviar} disabled={enviando || !respostaCompleta()} tamanho="lg">
              {enviando ? "Enviando…" : "Responder"}
            </Botao>
          </ClickSpark>
        ) : null}
      </div>

      {/* Espaçador: a barra de resultado é `fixed`, então sem isto ela cobriria
          o fim do cartão em telas curtas. */}
      {jaRespondida ? <div className="h-44" aria-hidden="true" /> : null}

      {jaRespondida ? (
        <BarraFeedback
          estado={resultado?.correta === true ? "acerto" : resultado?.correta === false ? "erro" : "registrado"}
          xpGanho={resultado?.xpGanho ?? 0}
          titulo={
            resultado?.correta === true
              ? "Certo!"
              : resultado?.correta === false
                ? "Não foi dessa vez."
                : "Resposta registrada."
          }
          rotuloAcao={acertou ? "Continuar" : errouComRevisao ? "Revisar aula" : "Tentar novamente"}
          aoAgir={acertou ? onContinuar : errouComRevisao ? aoErrarVoltarParaAula! : tentarNovamente}
        >
          {typeof resultado?.explicacao === "string" ? <p>{resultado.explicacao}</p> : null}

          {resultado?.explicacao && typeof resultado.explicacao === "object" ? (
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-extrabold">Critérios de autoavaliação</p>
                <ul className="list-inside list-disc">
                  {(resultado.explicacao as ExplicacaoAutoavaliada).criterios_autoavaliacao.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-extrabold">Exemplo de resposta forte</p>
                <p className="text-ink-soft">
                  {(resultado.explicacao as ExplicacaoAutoavaliada).exemplo_de_resposta_forte}
                </p>
              </div>
            </div>
          ) : null}
        </BarraFeedback>
      ) : null}
    </>
  );
}
