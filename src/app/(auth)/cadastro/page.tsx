import { prisma } from "@/lib/prisma";
import { CadastroForm } from "@/components/auth/CadastroForm";

export default async function CadastroPage() {
  const equipes = await prisma.equipe.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return <CadastroForm equipes={equipes} />;
}
