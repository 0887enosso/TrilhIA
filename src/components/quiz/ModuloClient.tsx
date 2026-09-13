"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoMascote } from "@/components/mascote/CarregandoMascote";
import { Botao } from "@/components/ui/Botao";
import { Coracoes } from "@/components/ui/Coracoes";
import { ContadorCoracoes } from "@/components/ui/ContadorCoracoes";
import { BadgePill } from "@/components/ui/BadgePill";
import { CountUp } from "@/components/reactbits/CountUp";
import { Confete } from "@/components/reactbits/Confete";
import { EtapaIndicador } from "@/components/reactbits/EtapaIndicador";
import { IconeXp } from "@/components/ui/iconesJogo";
import { CartaoQuestao } from "./CartaoQuestao";
import { ProjetoFinalFlow } from "./ProjetoFinalFlow";
import type { Questao, ResultadoResposta } from "./tipos";
import type { TrilhaId } from "@/lib/content";

type Aula = {
  ordem: number;
  titulo_aula: string;
  corpo: string;
  destaque?: string;
  atividade: Questao;
};

type ModuloConteudo = {
  modulo_id: string;
  titulo: string;
  descricao_curta: string;
  tempo_estimado_min: number;
  tipo_modulo?: string;
  aulas?: Aula[];
  atividade_final?: Questao[];
  // Ids de questões que o usuário já respondeu certo antes (XpConcedido já
  // existe para elas) — usado para retomar de onde parou em vez de
  // recomeçar o módulo do zero (ver calcularIndiceRetomada abaixo).
  questoesRespondidasCorretamente?: string[];
};

// Só presente para módulo tipo_modulo === "projeto_pratico" — entrega já
// registrada antes, usada pra ProjetoFinalFlow retomar de onde parou.
type EntregaExistente = {
  casoId: string;
  respostasTarefas: string[];
  checklistMarcado: boolean[];
} | null;

type Passo = { tipo: "licao"; aula: Aula } | { tipo: "questao"; questao: Questao };

type Fase = "carregando" | "erro" | "bloqueado" | "sem_energia" | "estudando" | "concluido";

/**
 * Acha de onde o usuário deve retomar o módulo: o primeiro passo "questao"
 * ainda não respondido certo — e, se essa questão tiver uma aula associada
 * (o passo imediatamente anterior), retoma a partir da AULA, não direto na
 * pergunta, pra não pular a explicação. Questões de atividade_final não têm
 * aula própria na lista, então retomam direto nelas. Se tudo já foi
 * respondido certo, retoma no último passo (só falta concluir).
 */
function calcularIndiceRetomada(passosMontados: Passo[], questoesRespondidasCorretamente: string[]): number {
  const respondidas = new Set(questoesRespondidasCorretamente);
  for (let i = 0; i < passosMontados.length; i++) {
    const passo = passosMontados[i];
    if (passo.tipo === "questao" && !respondidas.has(passo.questao.id)) {
      const anterior = passosMontados[i - 1];
      return anterior?.tipo === "licao" ? i - 1 : i;
    }
  }
  return Math.max(0, passosMontados.length - 1);
}

export function ModuloClient({ trilha, moduloId }: { trilha: TrilhaId; moduloId: string }) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("carregando");
  const [mensagemErro, setMensagemErro] = useState("");
  const [conteudo, setConteudo] = useState<ModuloConteudo | null>(null);
  const [passos, setPassos] = useState<Passo[]>([]);
  const [indice, setIndice] = useState(0);
  const [coracoesAtuais, setCoracoesAtuais] = useState(5);
  const [coracoesLiberamEm, setCoracoesLiberamEm] = useState<string | null>(null);
  const [xpSessao, setXpSessao] = useState(0);
  // Quando o usuário erra uma questão e volta pra revisar a aula relacionada,
  // guarda o índice de onde ele estava — pra o botão "Continuar" da aula
  // levar ele de volta pra essa questão específica, em vez de simplesmente
  // avançar um passo (que levaria pra outra questão, se a aula relacionada
  // não for a imediatamente anterior — caso das questões de atividade_final).
  const [indiceRevisaoRetorno, setIndiceRevisaoRetorno] = useState<number | null>(null);
  const [conclusao, setConclusao] = useState<{ badgesGanhas: string[]; certificadoEmitido: boolean } | null>(
    null
  );
  const [entregaExistente, setEntregaExistente] = useState<EntregaExistente>(null);

  useEffect(() => {
    iniciarEcarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trilha, moduloId]);

  async function iniciarEcarregar() {
    setFase("carregando");

    const respostaIniciar = await fetch("/api/progresso/modulo/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trilha, moduloId }),
    });
    const corpoIniciar = await respostaIniciar.json();

    if (!respostaIniciar.ok) {
      setMensagemErro(corpoIniciar.erro ?? "Não foi possível iniciar o módulo.");
      const codigosBloqueio = ["limite_diario_atingido", "trilha_bloqueada", "modulo_bloqueado"];
      setFase(codigosBloqueio.includes(corpoIniciar.codigo) ? "bloqueado" : "erro");
      return;
    }
    setCoracoesAtuais(corpoIniciar.coracoesAtuais);
    setCoracoesLiberamEm(corpoIniciar.coracoesLiberamEm ?? null);

    // Vidas não são mais restauradas ao (re)iniciar um módulo — só pela
    // regeneração automática por tempo. Se o usuário voltar antes das 2h
    // passarem, mostra direto a tela de "sem energia" com o cronômetro, em
    // vez de deixá-lo entrar no módulo só para ser barrado na 1ª pergunta.
    if (corpoIniciar.coracoesAtuais <= 0) {
      setFase("sem_energia");
      return;
    }

    // O conteúdo do módulo já vem nesta mesma resposta (ver POST
    // /api/progresso/modulo/iniciar) — antes disso era uma 2ª requisição
    // sequencial só pra buscar o que esta rota já sabia que ia liberar.
    const modulo: ModuloConteudo = corpoIniciar.modulo;
    setConteudo(modulo);

    if (modulo.tipo_modulo === "projeto_pratico") {
      setEntregaExistente(corpoIniciar.entregaExistente ?? null);
      setFase("estudando"); // ProjetoFinalFlow assume o controle a partir daqui
      return;
    }

    const passosMontados: Passo[] = [
      ...(modulo.aulas ?? []).flatMap((aula) => [
        { tipo: "licao" as const, aula },
        { tipo: "questao" as const, questao: aula.atividade },
      ]),
      ...(modulo.atividade_final ?? []).map((questao) => ({ tipo: "questao" as const, questao })),
    ];
    setPassos(passosMontados);
    setIndice(calcularIndiceRetomada(passosMontados, modulo.questoesRespondidasCorretamente ?? []));
    setXpSessao(0);
    setFase("estudando");
  }

  async function responderQuestao(questao: Questao, resposta: unknown): Promise<ResultadoResposta> {
    const res = await fetch("/api/progresso/questao/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trilha, moduloId, questaoId: questao.id, resposta }),
    });
    const corpo = await res.json();

    if (!res.ok) {
      if (corpo.codigo === "sem_coracoes") {
        setCoracoesLiberamEm(corpo.coracoesLiberamEm ?? null);
        setFase("sem_energia");
      }
      return { correta: false, xpGanho: 0, coracoesAtuais: 0, xpTotal: 0, nivel: 1, explicacao: corpo.erro };
    }

    setCoracoesAtuais(corpo.coracoesAtuais);
    if (corpo.xpGanho > 0) setXpSessao((atual) => atual + corpo.xpGanho);
    // Corações podem chegar a 0 aqui sem bloquear ainda de propósito: o
    // cartão precisa renderizar a explicação da resposta errada primeiro.
    // O bloqueio ("sem_energia") só acontece quando o usuário tenta
    // responder de novo e a API rejeita com 403 sem_coracoes (acima).

    // A barra de status do topo (TopHud) vem do layout — um Server Component
    // que só refaz a busca em navegação de página inteira, não a cada
    // interação dentro deste client component. Sem este refresh, ela ficava
    // "congelada" no valor de corações/XP/streak de quando a página abriu,
    // podendo mostrar um coração cheio (ou nenhum cronômetro) mesmo depois
    // do usuário já ter zerado as vidas de verdade nesta sessão.
    router.refresh();

    return corpo;
  }

  async function avancar() {
    const proximo = indice + 1;
    if (proximo < passos.length) {
      setIndice(proximo);
      return;
    }
    await concluirModulo();
  }

  // Botão "Continuar" de uma aula: normalmente só avança um passo. Mas se o
  // usuário chegou nessa aula "de revisão" (errou uma questão e voltou pra
  // reler o conteúdo), volta direto pra questão que ele estava tentando
  // responder, em vez de avançar linearmente pra próxima coisa da lista.
  async function continuarDaLicao() {
    if (indiceRevisaoRetorno !== null) {
      const alvo = indiceRevisaoRetorno;
      setIndiceRevisaoRetorno(null);
      setIndice(alvo);
      return;
    }
    await avancar();
  }

  async function concluirModulo() {
    setFase("carregando");
    const res = await fetch("/api/progresso/modulo/concluir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trilha, moduloId }),
    });
    const corpo = await res.json();

    if (!res.ok) {
      setMensagemErro(corpo.erro ?? "Não foi possível concluir o módulo.");
      setFase("erro");
      return;
    }

    setConclusao({ badgesGanhas: corpo.badgesGanhas ?? [], certificadoEmitido: corpo.certificadoEmitido ?? false });
    setFase("concluido");
    router.refresh(); // sincroniza XP/estrelas do TopHud com o que acabou de ser concedido
  }

  // Passo "questao" -> passo da aula para onde o "Revisar aula" deve levar.
  //
  // A questão pode dizer a qual aula ela pertence (`aula_relacionada`, índice
  // base 1 — ver scripts/vincular-atividade-final-a-aula.ts). Quando diz,
  // é isso que manda. Antes disso, o cálculo era sempre "a aula mais próxima
  // antes da questão na lista": correto para as questões embutidas numa aula
  // (a aula é a anterior imediata), mas arbitrário para as 120 questões de
  // atividade final, que ficam todas DEPOIS de todas as aulas — e por isso
  // caíam sempre na última aula do módulo, independentemente do que cobravam.
  const questaoIndiceParaAulaIndice = useMemo(() => {
    const passosDeLicao = passos.reduce<number[]>((acc, passo, i) => {
      if (passo.tipo === "licao") acc.push(i);
      return acc;
    }, []);

    const mapa = new Map<number, number | null>();
    passos.forEach((passo, i) => {
      if (passo.tipo !== "questao") return;

      const declarada = passo.questao.aula_relacionada;
      if (declarada && passosDeLicao[declarada - 1] !== undefined) {
        mapa.set(i, passosDeLicao[declarada - 1]);
        return;
      }

      // Sem vínculo declarado: a aula mais próxima antes da questão. É o
      // caso das questões embutidas em aula, onde essa aula é a própria.
      let aulaIndice: number | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (passos[j].tipo === "licao") {
          aulaIndice = j;
          break;
        }
      }
      mapa.set(i, aulaIndice);
    });
    return mapa;
  }, [passos]);

  if (fase === "carregando") {
    return <CarregandoMascote texto="Carregando…" />;
  }

  if (fase === "bloqueado") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="sentado" size={110} />
        <p className="max-w-sm text-sm text-ink-soft">{mensagemErro}</p>
        <Link href={`/trilha/${trilha}`}>
          <Botao variante="secundaria">Voltar à trilha</Botao>
        </Link>
      </div>
    );
  }

  if (fase === "erro") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="cansado" size={110} />
        <p className="max-w-sm text-sm text-ink-soft">{mensagemErro}</p>
        <Link href={`/trilha/${trilha}`}>
          <Botao variante="secundaria">Voltar à trilha</Botao>
        </Link>
      </div>
    );
  }

  if (fase === "sem_energia") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="cansado" size={110} />
        <p className="max-w-sm text-sm text-ink-soft">
          Você ficou sem corações. Eles voltam sozinhos com o tempo — sem precisar reiniciar o módulo. Quando
          voltar, você continua de onde parou.
        </p>
        {coracoesLiberamEm ? <ContadorCoracoes liberamEm={coracoesLiberamEm} /> : null}
        <Link href={`/trilha/${trilha}`}>
          <Botao variante="secundaria">Voltar à trilha</Botao>
        </Link>
      </div>
    );
  }

  if (fase === "concluido") {
    return (
      <>
        <Confete />
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="animate-estourar">
            <Mascote pose="comemorando" size={150} />
          </span>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-jade-strong">
              Trecho concluído
            </p>
            <h1 className="mt-1 font-sans text-4xl font-extrabold text-ink">Módulo concluído!</h1>
          </div>

          <p className="font-variant-tabular inline-flex items-center gap-2 rounded-full border-2 border-amber-strong bg-amber-soft px-5 py-2 text-xl font-extrabold text-amber-strong shadow-press-amber">
            <IconeXp tamanho={22} />+<CountUp to={xpSessao} duration={1.1} /> XP nesta sessão
          </p>

          {conclusao?.badgesGanhas.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {conclusao.badgesGanhas.map((b) => (
                <span key={b} className="animate-estourar">
                  <BadgePill cor="amber">Nova conquista: {b.replace(/-/g, " ")}</BadgePill>
                </span>
              ))}
            </div>
          ) : null}

          {conclusao?.certificadoEmitido ? (
            <BadgePill cor="trail">Certificado emitido — veja em Conquistas</BadgePill>
          ) : null}

          <Link href={`/trilha/${trilha}`} className="mt-2">
            <Botao tamanho="lg">Voltar à trilha</Botao>
          </Link>
        </div>
      </>
    );
  }

  // fase === "estudando"
  if (!conteudo) return null;

  if (conteudo.tipo_modulo === "projeto_pratico") {
    return (
      <ProjetoFinalFlow
        trilha={trilha}
        conteudo={conteudo as unknown as Record<string, unknown>}
        entregaExistente={entregaExistente}
        onConcluido={concluirModulo}
      />
    );
  }

  const passoAtual = passos[indice];
  const aulaIndiceParaRevisao = questaoIndiceParaAulaIndice.get(indice) ?? null;
  const aoErrarVoltarParaAula =
    aulaIndiceParaRevisao !== null
      ? () => {
          setIndiceRevisaoRetorno(indice);
          setIndice(aulaIndiceParaRevisao);
        }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">{conteudo.titulo}</p>
          <div className="mt-2">
            <EtapaIndicador total={passos.length} atual={indice} />
          </div>
        </div>
        <Coracoes atuais={coracoesAtuais} />
      </div>

      {passoAtual?.tipo === "licao" ? (
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-rule bg-parchment-surface p-6">
          <h2 className="font-display text-xl text-ink">{passoAtual.aula.titulo_aula}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{passoAtual.aula.corpo}</p>
          {passoAtual.aula.destaque ? (
            <p className="rounded-md border-l-4 border-amber bg-amber-soft px-4 py-2 text-sm text-amber-strong">
              {passoAtual.aula.destaque}
            </p>
          ) : null}
          <Botao onClick={continuarDaLicao} className="self-start">
            Continuar
          </Botao>
        </div>
      ) : null}

      {passoAtual?.tipo === "questao" ? (
        <CartaoQuestao
          key={passoAtual.questao.id}
          questao={passoAtual.questao}
          onResponder={(resposta) => responderQuestao(passoAtual.questao, resposta)}
          onContinuar={avancar}
          aoErrarVoltarParaAula={aoErrarVoltarParaAula}
        />
      ) : null}
    </div>
  );
}
