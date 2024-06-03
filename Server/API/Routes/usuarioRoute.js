import UsuarioController from "../Controllers/usuarioController.js";
import { usuarioSchema, addUserSchema } from "../validators/usuarioValidator.js";

async function usuarioRoutes(fastify, options) {
  const usuarioController = new UsuarioController(options.db);

  fastify.get("/", async (request, reply) => {
    const { name, password } = request.query;
    try {
      const exists = await usuarioController.getUsuario({ name, password });
      reply.send({ exists });
    } catch (error) {
      reply.status(500).send({ error: "Erro ao verificar o usuário" });
    }
  });

  fastify.post("/add", async (request, reply) => {
    const { name, password } = request.body;
    try {
      console.log(name, password);
      const newUser = await usuarioController.addUsuario({ name, password });
      console.log("test");
      reply.send({ success: true });
    } catch (error) {
      reply.status(500).send({ success: false, error: "Erro ao adicionar o usuário" });
    }
  });
}

export default usuarioRoutes;