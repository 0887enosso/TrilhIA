"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { limparAjusteHud } from "./estadoHud";

export function LogoutButton() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // O ajuste do HUD vive num módulo, não num componente: ele sobrevive à
    // navegação client-side da saída. Sem limpar aqui, o próximo login nesta
    // mesma aba começaria mostrando o XP e os corações de quem saiu, até a
    // primeira resposta ou recarga de página (ver estadoHud.ts).
    limparAjusteHud();
    router.push("/login");
  }

  return (
    <Botao variante="texto" onClick={sair} disabled={saindo}>
      {saindo ? "Saindo…" : "Sair"}
    </Botao>
  );
}
