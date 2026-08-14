-- CreateEnum
CREATE TYPE "TipoConquista" AS ENUM ('EMBLEMA', 'TROFEU');

-- AlterTable
ALTER TABLE "ConquistaUsuario" ADD COLUMN     "tipo" "TipoConquista" NOT NULL DEFAULT 'EMBLEMA';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "maiorSequenciaAcertos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maiorStreakJaAlcancado" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sequenciaAcertosAtual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakUsouFreezeNaSequenciaAtual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zerouCoracoesNaBasica" BOOLEAN NOT NULL DEFAULT false;

