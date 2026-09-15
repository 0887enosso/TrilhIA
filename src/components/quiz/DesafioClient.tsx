"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";
import { IconeRaio } from "@/components/app/icones";
import { CountUp } from "@/components/reactbits/CountUp";
import { limparAjusteHud, publicarAjusteHud } from "@/components/app/estadoHud";
import { Confete } from "@/components/reactbits/Confete";
import { IconeXp } from "@/components/ui/iconesJogo";
import { CartaoQuestao } from "./CartaoQuestao";
import type { Questao, ResultadoResposta } from "./tipos";
import type { TrilhaId } from "@/lib/content";
import type { DesafioParaCliente } from "@/lib/desafioDiario";

type ItemDesafio = { trilha: TrilhaId; moduloId: string; jaRespondidaHoje: boolean; questao: Questao };

type Fase = "vazio" | "pronto" | "tudo_respondido";

function faseInicial(desafio: DesafioParaCliente["desafio"]): Fase {
  if (!desafio) return "vazio";
  return desafio.concluido ? "tudo_respondido" : "pronto";
}

function respondidasInicial(desafio: DesafioParaCliente["desafio"]): Set<string> {
  if (!desafio) return new Set();
  return new Set(desafio.questoes.filter((i) => i.jaRespondidaHoje).map((i) => i.questao.id));
}

/**
 * `dadosIniciais` vem pronto do Server Component da página (mesma leitura que
 * antes era feita só depois de montar no navegador, via `useEffect` + fetch —
 * ver histórico deste arquivo). Os `useState(() => ...)` abaixo rodam a
 * inicialização uma única vez, no primeiro render: como o componente
 * inteiro é desmontado/remontado a cada navegação para esta rota (Next.js
 * troca o Server Component da página), não há risco de ficar com dado velho
 * de uma visita anterior.
 */
export function DesafioClient({ dadosIniciais }: { dadosIniciais: DesafioParaCliente }) {
  const router = useRouter();
  // Sem setter: a fase é decidida uma vez a partir dos dados que o Server
  // Component entregou e nunca muda por conta própria — a transição para
  // "tudo respondido" é feita pela condição de render mais abaixo, não por
  // uma escrita de estado. Mantido como `useState` (e não um `const`
  // derivado) de propósito: derivar recalcularia a cada render, mudando o
  // comportamento quando o `router.refresh()` da conclusão traz props novas.
  const [fase] = useState<Fase>(() => faseInicial(dadosIniciais.desafio));
  const [itens] = useState<ItemDesafio[]>(() => dadosIniciais.desafio?.questoes ?? []);
  const [respondidasAgora, setRespondidasAgora] = useState<Set<string>>(() =>
    respondidasInicial(dadosIniciais.desafio)
  );
  const [xpBonus, setXpBonus] = useState<number | null>(() =>
    dadosIniciais.desafio?.concluido ? dadosIniciais.desafio.xpBonusConcedido : null
  );

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
      // Concluir o desafio do dia é o único momento em que o foguinho avança
      // (ver src/lib/desafioDiario.ts), e o foguinho não sai da resposta desta
      // API — só o servidor sabe o valor novo. Então aqui, e só aqui, ainda
      // vale a pena refazer a árvore. Limpa o ajuste antes para o dado fresco
      // do servidor não ficar sobreposto pelo valor local.
      limparAjusteHud();
      router.refresh();
      return corpo;
    }

    // Caso comum: só corações/XP/nível mudaram, e os três vieram na resposta.
    // Publicar sai de graça no lugar de um refresh de ~375ms por questão.
    publicarAjusteHud({
      coracoesAtuais: corpo.coracoesAtuais,
      xpTotal: corpo.xpTotal,
      nivel: corpo.nivel,
    });
    return corpo;
  }

  function marcarRespondida(id: string) {
    setRespondidasAgora((prev) => new Set(prev).add(id));
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
      <>
        {xpBonus ? <Confete /> : null}
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="animate-estourar">
            <Mascote pose="comemorando" size={140} />
          </span>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-jade-strong">
              Foguinho mantido
            </p>
            <h1 className="mt-1 font-sans text-3xl font-extrabold text-ink">
              Desafio de hoje concluído!
            </h1>
          </div>
          {xpBonus ? (
            <p className="font-variant-tabular inline-flex items-center gap-2 rounded-full border-2 border-amber-strong bg-amber-soft px-5 py-2 text-xl font-extrabold text-amber-strong shadow-press-amber">
              <IconeXp tamanho={22} />+<CountUp to={xpBonus} duration={1} /> XP de bônus
            </p>
          ) : null}
          <Link href="/inicio" className="mt-2">
            <Botao tamanho="lg">Voltar ao início</Botao>
          </Link>
        </div>
      </>
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
