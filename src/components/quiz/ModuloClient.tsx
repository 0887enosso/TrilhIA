"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoMascote } from "@/components/mascote/CarregandoMascote";
import { Botao } from "@/components/ui/Botao";
import { Coracoes } from "@/components/ui/Coracoes";
import { BadgePill } from "@/components/ui/BadgePill";
import { CountUp } from "@/components/reactbits/CountUp";
import { EtapaIndicador } from "@/components/reactbits/EtapaIndicador";
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
};

type Passo = { tipo: "licao"; aula: Aula } | { tipo: "questao"; questao: Questao };

type Fase = "carregando" | "erro" | "bloqueado" | "sem_energia" | "estudando" | "concluido";

export function ModuloClient({ trilha, moduloId }: { trilha: TrilhaId; moduloId: string }) {
  const [fase, setFase] = useState<Fase>("carregando");
  const [mensagemErro, setMensagemErro] = useState("");
  const [conteudo, setConteudo] = useState<ModuloConteudo | null>(null);
  const [passos, setPassos] = useState<Passo[]>([]);
  const [indice, setIndice] = useState(0);
  const [coracoesAtuais, setCoracoesAtuais] = useState(5);
  const [xpSessao, setXpSessao] = useState(0);
  const [conclusao, setConclusao] = useState<{ badgesGanhas: string[]; certificadoEmitido: boolean } | null>(
    null
  );

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

    const respostaConteudo = await fetch(`/api/trilhas/${trilha}/modulos/${moduloId}`);
    const corpoConteudo = await respostaConteudo.json();

    if (!respostaConteudo.ok) {
      setMensagemErro(corpoConteudo.erro ?? "Não foi possível carregar o módulo.");
      setFase("erro");
      return;
    }

    const modulo: ModuloConteudo = corpoConteudo.modulo;
    setConteudo(modulo);

    if (modulo.tipo_modulo === "projeto_pratico") {
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
    setIndice(0);
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
      if (corpo.codigo === "sem_coracoes") setFase("sem_energia");
      return { correta: false, xpGanho: 0, coracoesAtuais: 0, xpTotal: 0, nivel: 1, explicacao: corpo.erro };
    }

    setCoracoesAtuais(corpo.coracoesAtuais);
    if (corpo.xpGanho > 0) setXpSessao((atual) => atual + corpo.xpGanho);
    // Corações podem chegar a 0 aqui sem bloquear ainda de propósito: o
    // cartão precisa renderizar a explicação da resposta errada primeiro.
    // O bloqueio ("sem_energia") só acontece quando o usuário tenta
    // responder de novo e a API rejeita com 403 sem_coracoes (acima).
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
  }

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
          Você ficou sem corações. Reinicie o módulo para tentar de novo — os corações voltam ao máximo.
        </p>
        <div className="flex gap-3">
          <Link href={`/trilha/${trilha}`}>
            <Botao variante="secundaria">Voltar à trilha</Botao>
          </Link>
          <Botao onClick={iniciarEcarregar}>Reiniciar módulo</Botao>
        </div>
      </div>
    );
  }

  if (fase === "concluido") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="comemorando" size={130} />
        <h1 className="font-sans text-3xl font-extrabold text-ink">Módulo concluído!</h1>
        <p className="font-variant-tabular rounded-full bg-amber-soft px-4 py-1.5 text-lg font-extrabold text-amber-strong">
          +<CountUp to={xpSessao} duration={1.1} /> XP nesta sessão
        </p>
        {conclusao?.badgesGanhas.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {conclusao.badgesGanhas.map((b) => (
              <BadgePill key={b} cor="amber">
                Nova badge: {b.replace(/-/g, " ")}
              </BadgePill>
            ))}
          </div>
        ) : null}
        {conclusao?.certificadoEmitido ? (
          <BadgePill cor="trail">Certificado emitido — veja em Conquistas</BadgePill>
        ) : null}
        <Link href={`/trilha/${trilha}`}>
          <Botao>Voltar à trilha</Botao>
        </Link>
      </div>
    );
  }

  // fase === "estudando"
  if (!conteudo) return null;

  if (conteudo.tipo_modulo === "projeto_pratico") {
    return (
      <ProjetoFinalFlow
        trilha={trilha}
        conteudo={conteudo as unknown as Record<string, unknown>}
        onConcluido={concluirModulo}
      />
    );
  }

  const passoAtual = passos[indice];

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
          <Botao onClick={avancar} className="self-start">
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
        />
      ) : null}
    </div>
  );
}
