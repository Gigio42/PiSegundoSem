import AdmController from "../Controllers/admController.js";
import { deleteMaquina } from "../Controllers/admController.js"; // Importe a função deleteMaquina

async function admRoute(fastify, options) {
  const admController = new AdmController(options.db);

  fastify.get("/maquina", async (request, reply) => {
    try {
      const maquina_id = await admController.getMaquina(request.params.item);
      reply.send(maquina_id);
    } catch (err) {
      reply.code(500).send({
        message: "Error retrieving data from SQLite database",
        error: err.message,
      });
    }
  });

  fastify.get("/items/chapas", async (request, reply) => {
    try {
      const chapas = await admController.getChapasInItems();
      console.log("Dados retornados pelo servidor:", chapas); // Adiciona um log dos dados retornados
      reply.send(chapas);
    } catch (err) {
      console.error("Erro ao buscar chapas:", err);
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/atualizar-prioridades", async (request, reply) => {
    try {
      const newPriorities = request.body;
      await admController.updateItemPriorities(newPriorities);
      reply.send({ message: "Prioridades atualizadas com sucesso!" });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: "Erro ao atualizar as prioridades" });
    }
  });

  fastify.post(
    "/maquina/:maquinaId/item/:itemId/produzindo",
    async (request, reply) => {
      try {
        const maquinaId = parseInt(request.params.maquinaId, 10);
        const itemId = parseInt(request.params.itemId, 10);
        const {
          prazo,
          ordem,
          medida,
          op,
          sistema,
          cliente,
          quantidade,
          colaborador,
          prioridade,
          executor, // Receber o executor aqui
        } = request.body; // Incluir executor aqui

        console.log("Dados recebidos na rota:", {
          prazo,
          ordem,
          medida,
          op,
          sistema,
          cliente,
          quantidade,
          colaborador,
          prioridade,
          executor, // Log para verificar se o executor está sendo recebido
        });

        await admController.changeItemStatusProduzindo(
          itemId,
          maquinaId,
          prazo,
          parseInt(ordem, 10),
          medida,
          parseInt(op, 10),
          sistema,
          cliente,
          parseInt(quantidade, 10),
          colaborador,
          parseInt(prioridade, 10), // Passar prioridade como um inteiro
          executor // Passar o executor para o controlador
        );

        reply.send({ message: "Status do item atualizado para PRODUZINDO" });
        console.log(
          `Solicitação POST para /maquina/${maquinaId}/item/${itemId}/produzindo realizada com sucesso`
        );
      } catch (err) {
        console.error(
          "Erro ao processar a solicitação POST para /maquina/:maquinaId/item/:itemId/produzindo:",
          err
        );
        reply.code(500).send({ message: "Internal Server Error" });
      }
    }
  );

  fastify.get("/maquina/:maquinaId/item", async (request, reply) => {
    try {
      const maquinaId = parseInt(request.params.maquinaId, 10);
      const items = await admController.getAllItemsByMaquina(maquinaId);
      reply.send(items);
    } catch (err) {
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/maquina/itens/prioridades", async (request, reply) => {
    try {
      const { ids } = request.body;

      // Busca os itens com as prioridades pelos IDs fornecidos
      const items = await admController.getAllItemsPriorities(ids);

      reply.send(items);
    } catch (err) {
      console.error("Erro ao buscar prioridades dos itens existentes:", err);
      reply
        .code(500)
        .send({ message: "Erro ao buscar prioridades dos itens existentes." });
    }
  });

// No arquivo de rotas, por exemplo, routes/itemMaquinaRoutes.js

fastify.delete("/item_maquina/:id", async (request, reply) => {
  try {
    const { id } = request.params;

    // Chamar a função do controlador para excluir o item
    await admController.deleteItemMaquina(id);

    // Enviar uma resposta de sucesso
    reply.status(204).send(); // 204 No Content
  } catch (err) {
    console.error("Erro ao excluir o item de máquina:", err);
    reply
      .code(500)
      .send({ message: "Erro ao excluir o item de máquina." });
  }
});

  

  fastify.get("/item_maquina", async (request, reply) => {
    try {
      const itemMaquinas = await admController.getAllItemMaquina(); // Nova função no controlador para buscar todos os Item_Maquina
      reply.send(itemMaquinas);
    } catch (err) {
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/item_maquina/selecionar-maquinas", async (request, reply) => {
    try {
      const items = request.body;

      // Log de todas as máquinas recebidas
      console.log("Recebido para criação de Itens_Maquina:", items);

      // Aqui você pode adicionar um console.log para os maquinaIds
      const allMaquinaIds = items.map((item) => item.maquinaId);
      console.log("Todos os maquinaIds recebidos:", allMaquinaIds);

      const createdItems = [];

      for (const {
        itemId,
        maquinaId,
        ordem,
        prazo,
        executor,
        finalizado,
        corte,
      } of items) {
        const createdItem = await admController.createItemMaquina(
          itemId,
          maquinaId,
          ordem,
          prazo,
          executor,
          finalizado,
          corte
        );
        createdItems.push(createdItem);
      }

      reply.send({
        message: "Itens_Maquina criados com sucesso.",
        createdItems,
      });
    } catch (err) {
      console.error("Erro ao criar Itens_Maquina:", err);
      reply.code(500).send({ message: "Erro ao criar Itens_Maquina." });
    }
  });

  fastify.get("/item_maquina/existence-check", async (request, reply) => {
    try {
      const { itemId, maquinaId } = request.query;
      console.log(
        `Received existence check request for itemId: ${itemId}, maquinaId: ${maquinaId}`
      );

      if (!itemId || !maquinaId) {
        reply.code(400).send({ message: "itemId and maquinaId are required." });
        return;
      }

      const maquinaIds = maquinaId.split(",").map((id) => parseInt(id.trim()));

      const promises = maquinaIds.map(async (id) => {
        const exists = await admController.checkItemMaquinaExists(
          parseInt(itemId),
          id
        );
        return { maquinaId: id, exists: exists };
      });

      const results = await Promise.all(promises);

      const exists = results.some((result) => result.exists);

      reply.send({ exists });
    } catch (err) {
      console.error("Erro ao verificar a existência do item_maquina:", err);
      reply
        .code(500)
        .send({ message: "Erro ao verificar a existência do item_maquina." });
    }
  });

  fastify.post("/maquina", async (request, reply) => {
    try {
      const { nome } = request.body;
      const newMaquina = await admController.createMaquina(nome);
      reply.send(newMaquina);
    } catch (err) {
      console.error("Erro ao criar uma nova máquina:", err);
      reply.code(500).send({
        message: "Erro ao criar uma nova máquina",
        error: err.message,
      });
    }
  });

  fastify.delete("/maquina/:id", async (request, reply) => {
    console.log("Recebida requisição DELETE para /adm/maquina/:id");
    const maquinaId = parseInt(request.params.id, 10);
    console.log(`ID da máquina a ser deletada: ${maquinaId}`);
    try {
      await deleteMaquina(maquinaId);
      reply.code(204).send();
    } catch (err) {
      console.error("Erro ao deletar a máquina:", err);
      reply
        .code(500)
        .send({ message: "Erro ao deletar a máquina", error: err.message });
    }
  });
}

export default admRoute;
