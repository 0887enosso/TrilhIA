import { trilhaBasicaConcluida } from "./ligas";
import { obterProgressoAgregado } from "./progresso";
import { TrilhaId } from "./content";

/**
 * Lançado quando o usuário tenta agir sobre um módulo ao qual ainda não tem
 * acesso — trilha intermediária sem a básica concluída, ou módulo cujo
 * anterior (na mesma trilha) ainda não foi concluído. `codigo` é repassado
 * como está para o corpo da resposta HTTP 403 de cada rota que chama
 * `garantirAcessoAoModulo`, então seus valores são parte do contrato com o
 * frontend — não renomeie sem atualizar quem consome.
 */
export class AcessoModuloBloqueadoError extends Error {
  constructor(
    public codigo: "trilha_bloqueada" | "modulo_bloqueado",
    message: string
  ) {
    super(message);
    this.name = "AcessoModuloBloqueadoError";
  }
}

/**
 * Trava central de acesso a módulo — extraída de POST
 * /api/progresso/modulo/iniciar, que era a ÚNICA rota que checava isso antes
 * desta correção. Responder questão, concluir módulo e registrar entrega do
 * projeto final nunca checavam se o módulo estava desbloqueado, permitindo
 * concluir/certificar módulos (e trilhas inteiras) nunca iniciados via
 * chamada direta à API. Toda rota que lê ou grava progresso de um módulo
 * específico deve chamar esta função logo após validar o corpo da
 * requisição, antes de qualquer leitura/escrita de progresso.
 *
 * Lança `AcessoModuloBloqueadoError` se o acesso estiver bloqueado; não
 * retorna nada em caso de acesso permitido.
 */
export async function garantirAcessoAoModulo(
  usuarioId: string,
  trilha: TrilhaId,
  moduloId: string
): Promise<void> {
  // Trilha Intermediária só libera depois da Básica 100% concluída — não é
  // escolha livre de trilha.
  if (trilha === "intermediaria" && !(await trilhaBasicaConcluida(usuarioId))) {
    throw new AcessoModuloBloqueadoError(
      "trilha_bloqueada",
      "Conclua a Trilha Básica antes de começar a Trilha Intermediária."
    );
  }

  // Módulo seguinte só libera depois que o anterior está concluído.
  const progresso = await obterProgressoAgregado(usuarioId);
  const moduloAlvo = progresso[trilha].modulos.find((m) => m.modulo_id === moduloId);
  if (moduloAlvo && !moduloAlvo.desbloqueado) {
    throw new AcessoModuloBloqueadoError(
      "modulo_bloqueado",
      "Conclua o módulo anterior antes de acessar este."
    );
  }
}
