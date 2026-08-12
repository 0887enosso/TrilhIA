"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";

export function LogoutButton() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <Botao variante="texto" onClick={sair} disabled={saindo}>
      {saindo ? "Saindo…" : "Sair"}
    </Botao>
  );
}
