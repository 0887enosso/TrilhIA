-- ultimoDiaAtivo é substituído por ultimoDesafioDiarioConcluidoEm: o
-- foguinho (streakAtual) passa a medir conclusão do desafio diário, não
-- "usou o app nesse dia" — os dois conceitos não são a mesma coisa, então
-- não faz sentido preservar o valor antigo por um simples RENAME COLUMN.
-- streakAtual em si (e outros valores de gamificação) são zerados
-- separadamente, fora desta migração, via script de dados.
ALTER TABLE "Usuario" DROP COLUMN "ultimoDiaAtivo",
ADD COLUMN     "contaTeste" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ultimoDesafioDiarioConcluidoEm" TIMESTAMP(3);
