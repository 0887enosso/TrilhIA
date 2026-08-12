"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mascote } from "@/components/mascote/Mascote";
import { CarregandoMascote } from "@/components/mascote/CarregandoMascote";
import { Botao } from "@/components/ui/Botao";
import { IconeRaio } from "@/components/app/icones";
import { CountUp } from "@/components/reactbits/CountUp";
import { CartaoQuestao } from "./CartaoQuestao";
import type { Questao, ResultadoResposta } from "./tipos";
import type { TrilhaId } from "@/lib/content";

type ItemDesafio = { trilha: TrilhaId; moduloId: string; jaRespondidaHoje: boolean; questao: Questao };

type Fase = "carregando" | "vazio" | "pronto" | "tudo_respondido";

export function DesafioClient() {
  const [fase, setFase] = useState<Fase>("carregando");
  const [itens, setItens] = useState<ItemDesafio[]>([]);
  const [respondidasAgora, setRespondidasAgora] = useState<Set<string>>(new Set());
  const [xpBonus, setXpBonus] = useState<number | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setFase("carregando");
    const res = await fetch("/api/desafio-diario");
    const corpo = await res.json();

    if (!corpo.desafio) {
      setFase("vazio");
      return;
    }

    setItens(corpo.desafio.questoes);
    setXpBonus(corpo.desafio.concluido ? corpo.desafio.xpBonusConcedido : null);
    const jaFeitas = new Set<string>(
      corpo.desafio.questoes.filter((i: ItemDesafio) => i.jaRespondidaHoje).map((i: ItemDesafio) => i.questao.id)
    );
    setRespondidasAgora(jaFeitas);
    setFase(corpo.desafio.concluido ? "tudo_respondido" : "pronto");
  }

  async function responder(item: ItemDesafio, resposta: unknown): Promise<ResultadoResposta> {
    const res = await fetch("/api/progresso/questao/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trilha: item.trilha,
        moduloId: item.moduloId,
        questaoId: item.questao.id,
        resposta,
      }),
    });
    const corpo = await res.json();
    if (!res.ok) {
      return { correta: false, xpGanho: 0, coracoesAtuais: 0, xpTotal: 0, nivel: 1, explicacao: corpo.erro };
    }
    if (corpo.desafioDiario?.desafioConcluidoAgora) {
      setXpBonus(corpo.desafioDiario.xpBonus);
    }
    return corpo;
  }

  function marcarRespondida(id: string) {
    setRespondidasAgora((prev) => new Set(prev).add(id));
  }

  if (fase === "carregando") {
    return <CarregandoMascote texto="Carregando desafio de hoje…" />;
  }

  if (fase === "vazio") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="sentado" size={110} />
        <p className="max-w-sm text-sm text-ink-soft">
          Inicie pelo menos um módulo para desbloquear o desafio diário.
        </p>
        <Link href="/inicio">
          <Botao variante="secundaria">Voltar ao início</Botao>
        </Link>
      </div>
    );
  }

  const total = itens.length;
  const feitas = itens.filter((i) => respondidasAgora.has(i.questao.id)).length;
  const proxima = itens.find((i) => !respondidasAgora.has(i.questao.id));

  if (fase === "tudo_respondido" || (!proxima && xpBonus !== null)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Mascote pose="comemorando" size={130} />
        <h1 className="font-display text-2xl text-ink">Desafio de hoje concluído!</h1>
        {xpBonus ? (
          <p className="font-variant-tabular text-amber-strong">
            +<CountUp to={xpBonus} duration={1} /> XP de bônus
          </p>
        ) : null}
        <Link href="/inicio">
          <Botao>Voltar ao início</Botao>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-3xl border-2 border-rule bg-parchment-surface p-5">
        <span
          className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, var(--blaze-start), var(--blaze-end))" }}
        >
          <IconeRaio className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <h1 className="font-sans text-2xl font-extrabold text-ink">Desafio diário</h1>
          <p className="font-variant-tabular mt-0.5 text-sm font-bold text-ink-soft">{feitas} de {total} questões</p>
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-rule">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(feitas / total) * 100}%`,
                background: "linear-gradient(90deg, var(--blaze-start), var(--blaze-end))",
              }}
            />
          </div>
        </div>
      </div>

      {proxima ? (
        <CartaoQuestao
          key={proxima.questao.id}
          questao={proxima.questao}
          onResponder={(resposta) => responder(proxima, resposta)}
          onContinuar={() => marcarRespondida(proxima.questao.id)}
        />
      ) : null}
    </div>
  );
}
