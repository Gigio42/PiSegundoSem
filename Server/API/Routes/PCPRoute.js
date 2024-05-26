import PCPController from "../Controllers/PCPController.js";
import { createItemWithChapaSchema } from "../validators/pcpValidator.js";

async function pcpRoute(fastify, options) {
  const pcpRouteController = new PCPController(options.db);

  fastify.get("/chapas", async (request, reply) => {
    try {
      const filterCriteria = request.query.filterCriteria ? JSON.parse(request.query.filterCriteria) : {};
      const sortBy = request.query.sortBy || "medida";
      const sortOrder = request.query.sortOrder || "asc";
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
        await pcpRouteController.createItemWithChapa(request.body);
        reply.send({ message: "Data received and inserted into SQLite database successfully" });
      } catch (err) {
        console.log(err.message);
        reply.code(500).send({ message: "Error processing data", error: err.message });
      }
    },
  });

  fastify.delete("/items/:id", async (request, reply) => {
    try {
      const itemId = request.params.id;
      await pcpRouteController.deleteItem(itemId);
      reply.send({ message: `Item with id ${itemId} deleted successfully` });
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error deleting item from SQLite database", error: err.message });
    }
  });

  fastify.delete("/items/:itemId/chapas/:chapaId", async (request, reply) => {
    try {
      const itemId = request.params.itemId;
      const chapaId = request.params.chapaId;
      await pcpRouteController.deleteChapaFromItem(itemId, chapaId);
      reply.send({ message: `Chapa with id ${chapaId} deleted from item with id ${itemId} successfully` });
    } catch (err) {
      console.log(err.message);
      reply.code(500).send({ message: "Error deleting chapa from item in SQLite database", error: err.message });
    }
  });
}

export default pcpRoute;
