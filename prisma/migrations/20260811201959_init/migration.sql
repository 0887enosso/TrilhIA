-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('COLABORADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoLiga" AS ENUM ('PADRAO', 'EXCLUSIVA');

-- CreateTable
CREATE TABLE "Equipe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'COLABORADOR',
    "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT false,
    "senhaAlteradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "equipeId" TEXT NOT NULL,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "streakAtual" INTEGER NOT NULL DEFAULT 0,
    "streakFreezesDisponiveis" INTEGER NOT NULL DEFAULT 0,
    "ultimoDiaAtivo" TIMESTAMP(3),
    "coracoesAtuais" INTEGER NOT NULL DEFAULT 5,
    "modulosIniciadosHoje" INTEGER NOT NULL DEFAULT 0,
    "dataUltimoModuloIniciado" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressoModulo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "trilha" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),
    "xpGanho" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressoModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaQuestao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "tipoQuestao" TEXT NOT NULL,
    "correta" BOOLEAN,
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "respondidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConquistaUsuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "nomeBadge" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "conquistadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConquistaUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "trilha" TEXT NOT NULL,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liga" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLiga" NOT NULL DEFAULT 'PADRAO',
    "equipeId" TEXT,
    "condicaoDesbloqueio" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Liga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoLiga" (
    "id" TEXT NOT NULL,
    "ligaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "xpNaSemana" INTEGER NOT NULL DEFAULT 0,
    "posicaoFinal" INTEGER,

    CONSTRAINT "ParticipacaoLiga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesafioDiario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "questaoIds" TEXT[],
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),
    "xpBonusConcedido" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesafioDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpConcedido" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpConcedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaAcesso" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaProjetoFinal" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "respostasTarefas" JSONB NOT NULL,
    "checklistMarcado" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntregaProjetoFinal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_nome_key" ON "Equipe"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "ProgressoModulo_usuarioId_trilha_idx" ON "ProgressoModulo"("usuarioId", "trilha");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoModulo_usuarioId_moduloId_key" ON "ProgressoModulo"("usuarioId", "moduloId");

-- CreateIndex
CREATE INDEX "RespostaQuestao_usuarioId_questaoId_idx" ON "RespostaQuestao"("usuarioId", "questaoId");

-- CreateIndex
CREATE INDEX "RespostaQuestao_usuarioId_moduloId_idx" ON "RespostaQuestao"("usuarioId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "ConquistaUsuario_usuarioId_badgeId_key" ON "ConquistaUsuario"("usuarioId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_usuarioId_trilha_key" ON "Certificado"("usuarioId", "trilha");

-- CreateIndex
CREATE INDEX "ParticipacaoLiga_ligaId_semana_idx" ON "ParticipacaoLiga"("ligaId", "semana");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipacaoLiga_ligaId_usuarioId_semana_key" ON "ParticipacaoLiga"("ligaId", "usuarioId", "semana");

-- CreateIndex
CREATE UNIQUE INDEX "DesafioDiario_usuarioId_data_key" ON "DesafioDiario"("usuarioId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "XpConcedido_usuarioId_questaoId_key" ON "XpConcedido"("usuarioId", "questaoId");

-- CreateIndex
CREATE INDEX "TentativaAcesso_identificador_tipo_criadoEm_idx" ON "TentativaAcesso"("identificador", "tipo", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaProjetoFinal_usuarioId_moduloId_key" ON "EntregaProjetoFinal"("usuarioId", "moduloId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoModulo" ADD CONSTRAINT "ProgressoModulo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuestao" ADD CONSTRAINT "RespostaQuestao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConquistaUsuario" ADD CONSTRAINT "ConquistaUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liga" ADD CONSTRAINT "Liga_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoLiga" ADD CONSTRAINT "ParticipacaoLiga_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "Liga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoLiga" ADD CONSTRAINT "ParticipacaoLiga_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesafioDiario" ADD CONSTRAINT "DesafioDiario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpConcedido" ADD CONSTRAINT "XpConcedido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProjetoFinal" ADD CONSTRAINT "EntregaProjetoFinal_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
