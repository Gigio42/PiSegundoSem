import PCPController from "../Controllers/PCPController.js";
import { createItemWithChapaSchema } from "../validators/pcpValidator.js";

async function pcpRoute(fastify, options) {
  const pcpRouteController = new PCPController(options.db);

  fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.status(400).send(error.validation[0].message);
    } else {
      reply.send(error);
    }
  });

  fastify.get("/chapas", async (request, reply) => {
    try {
      const filterCriteria = request.query.filterCriteria ? JSON.parse(request.query.filterCriteria) : {};
      const sortBy = request.query.sortBy || "status";
      const sortOrder = request.query.sortOrder || "descending";
      const data = await pcpRouteController.getChapas(request.query, filterCriteria, sortOrder, sortBy);
      reply.send(data);
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error retrieving data from SQLite database", error: err.message });
    }
  });

  fastify.get("/items", async (request, reply) => {
    try {
      const searchQuery = request.query.search || "";
      const data = await pcpRouteController.getItems(searchQuery);
      reply.send(data);
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error retrieving data from SQLite database", error: err.message });
    }
  });

  fastify.post("/", {
    schema: createItemWithChapaSchema,
    handler: async (request, reply) => {
      try {
        const result = await pcpRouteController.createItemWithChapa(request.body);
        if (result.error) {
          reply.code(500).send({ message: "Erro de processamento", error: result.error });
        } else {
          reply.send({ message: "Data received and inserted into SQLite database successfully" });
        }
      } catch (err) {
        console.log(err.message);
        reply.code(500).send({ message: "Erro de processamento", error: err.message });
      }
    },
  });

  fastify.delete("/items/:id", async (request, reply) => {
    try {
      const itemId = parseInt(request.params.id, 10);
      const { reservedBy, dataFormatada } = request.body;

      await pcpRouteController.deleteItem(itemId, reservedBy, dataFormatada);
      reply.send({ message: `Item with id ${itemId} deleted successfully` });
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error deleting item from SQLite database", error: err.message });
    }
  });

  fastify.delete("/items/:itemId/chapas/:chapaId", async (request, reply) => {
    try {
      const itemId = parseInt(request.params.itemId, 10);
      const chapaId = parseInt(request.params.chapaId, 10);
      const { reservedBy, dataFormatada } = request.body;
      await pcpRouteController.deleteChapaFromItem(itemId, chapaId, reservedBy, dataFormatada);
      reply.send({ message: `Chapa with id ${chapaId} deleted from item with id ${itemId} successfully` });
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error deleting chapa from item in SQLite database", error: err.message });
    }
  });
}

export default pcpRoute;
