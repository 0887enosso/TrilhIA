-- CreateEnum
CREATE TYPE "StatusCadastro" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "statusCadastro" "StatusCadastro" NOT NULL DEFAULT 'PENDENTE',
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nickname_key" ON "Usuario"("nickname");
