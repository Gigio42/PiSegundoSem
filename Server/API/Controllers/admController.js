import Maquina from "../Models/maquinaModel.js";
import Chapa_Item from "../Models/chapa_itemModel.js";
import Item from "../Models/itemModel.js";
import Item_Maquina from "../Models/item_maquinaModel.js";

class AdmController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getMaquina() {
    const maquinas = await Maquina.findMany();
    return maquinas;
  }

  async getChapasInItems() {
    const chapaItems = await Chapa_Item.findMany({
      where: {
        item: {
          status: {
            contains: "RESERVADO",
          },
        },
      },
      include: {
        item: true,
        chapa: true,
      },
    });

    if (!chapaItems.length) {
      throw new Error(`No Chapa_Item found`);
    }

    const items = chapaItems.reduce((acc, chapaItem) => {
      const { item } = chapaItem;
      if (!acc[item.id_item]) {
        acc[item.id_item] = {
          ...item,
          chapas: [],
        };
      }
      acc[item.id_item].chapas.push(chapaItem.chapa);
      return acc;
    }, {});

    return Object.values(items);
  }

  async changeItemStatusProduzindo(itemId, maquinaId, prazo, ordem, medida, op, sistema, cliente, quantidade, colaborador) {
    try {
      await Item.update({
        where: { id_item: itemId },
        data: { status: "PRODUZINDO" },
      });

      await Item_Maquina.create({
        data: {
          maquinaId: maquinaId,
          itemId: itemId,
          prazo: prazo,
          ordem: parseInt(ordem, 10),
          medida: medida,
          op: parseInt(op, 10), // Convertendo para número
          sistema: sistema,
          cliente: cliente,
          quantidade: parseInt(quantidade, 10), // Convertendo para número
          colaborador: colaborador,
        },
      });

      console.log(
        `Item ${itemId} atualizado para status PRODUZINDO com prazo ${prazo}, ordem ${ordem}, medida ${medida}, op ${op}, sistema ${sistema}, cliente ${cliente}, quantidade ${quantidade}, colaborador ${colaborador}`,
      );
    } catch (error) {
      console.error("Erro ao atualizar o status do item para PRODUZINDO:", error);
      throw new Error("Erro ao atualizar o status do item para PRODUZINDO: " + error.message);
    }
  }

  async getAllItemsByMaquina(maquinaId) {
    try {
      const items = await Item_Maquina.findMany({
        where: {
          maquinaId: maquinaId,
        },
        include: {
          Item: true,
        },
      });

      // Mapeia os itens e inclui o id_item_maquina e a ordem de cada item
      return items.map((item_maquina) => {
        const item = item_maquina.Item;
        return {
          ...item,
          id_item_maquina: item_maquina.id_item_maquina,
          ordem: item_maquina.ordem, // Inclui a coluna "ordem"
        };
      });
    } catch (error) {
      throw new Error("Erro ao buscar itens para a máquina: " + error.message);
    }
  }

  async updateItemPriorities(newPriorities) {
    try {
      console.log("Recebido para atualização de prioridades:", newPriorities);

      // Verificar se todos os itens existem antes de atualizar
      for (const { id_item } of newPriorities) {
        const itemExists = await Item.findUnique({
          where: { id_item: id_item },
        });

        if (!itemExists) {
          throw new Error(`Item com id ${id_item} não encontrado`);
        }
      }

      await Promise.all(
        newPriorities.map(async ({ id_item, prioridade }) => {
          await Item.update({
            where: { id_item: id_item },
            data: { prioridade: prioridade },
          });
        }),
      );

      console.log("Prioridades dos itens atualizadas com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar as prioridades dos itens:", error);
      throw new Error("Erro ao atualizar as prioridades dos itens: " + error.message);
    }
  }

  async getAllItemMaquina() {
    try {
      const itemMaquinas = await Item_Maquina.findMany({
        include: {
          maquina: true,
          Item: true,
        },
      });
      return itemMaquinas;
    } catch (error) {
      throw new Error("Erro ao buscar todos os Item_Maquina: " + error.message);
    }
  }

  async createItemMaquina(itemId, maquinaId) {
    try {
      const lastItem = await Item_Maquina.findFirst({
        where: { itemId: itemId },
        orderBy: { ordem: "desc" },
      });

      let ordem = 1;
      if (lastItem) {
        ordem = lastItem.ordem + 1;
      }

      await Item_Maquina.create({
        data: {
          prazo: lastItem ? lastItem.prazo : null,
          ordem: ordem,
          executor: lastItem ? lastItem.executor : null,
          finalizado: lastItem ? lastItem.finalizado : false,
          corte: lastItem ? lastItem.corte : null,
          maquinaId: maquinaId,
          itemId: itemId,
        },
      });

      console.log(`Item_Maquina criado com sucesso para o item ${itemId} e a máquina ${maquinaId}.`);
    } catch (error) {
      console.error("Erro ao criar Item_Maquina:", error);
      throw new Error("Erro ao criar Item_Maquina: " + error.message);
    }
  }

  async checkItemMaquinaExists(itemId, maquinaId) {
    try {
      const existingItemMaquina = await Item_Maquina.findUnique({
        where: {
          itemId: itemId,
          maquinaId: maquinaId,
        },
      });

      return existingItemMaquina ? true : false;
    } catch (error) {
      console.error("Erro ao verificar se Item_Maquina existe:", error);
      throw new Error("Erro ao verificar se Item_Maquina existe: " + error.message);
    }
  }

  async checkItemMaquinaExists(itemId, maquinaId) {
    try {
      console.log(`Checking existence for itemId: ${itemId}, maquinaId: ${maquinaId}`);
      const existingItemMaquina = await Item_Maquina.findFirst({
        where: {
          itemId: itemId,
          maquinaId: maquinaId,
        },
      });

      console.log(`Existence check result: ${!!existingItemMaquina}`);
      return !!existingItemMaquina;
    } catch (error) {
      console.error("Erro ao verificar a existência do item_maquina:", error);
      throw new Error("Erro ao verificar a existência do item_maquina: " + error.message);
    }
  }

  // Método para criar uma nova máquina
  async createMaquina(nome) {
    try {
      const newMaquina = await Maquina.create({
        data: {
          nome: nome,
        },
      });
      return newMaquina;
    } catch (error) {
      console.error("Erro ao criar uma nova máquina:", error);
      throw new Error("Erro ao criar uma nova máquina: " + error.message);
    }
  }
}

async function deleteMaquina(maquinaId) {
  console.log(`Tentando deletar a máquina com ID: ${maquinaId}`);
  try {
    // Verifica se a máquina possui itens associados
    const maquina = await Maquina.findUnique({
      where: {
        id_maquina: maquinaId,
      },
      include: {
        items: true, // Inclui os itens associados à máquina
      },
    });

    if (!maquina) {
      throw new Error(`Máquina com ID ${maquinaId} não encontrada.`);
    }

    // Verifica se há itens associados à máquina
    if (maquina.items.length > 0) {
      // Lança um erro indicando que a máquina possui itens associados
      throw new Error("Não é possível deletar a máquina porque há itens associados a ela.");
    }

    // Remove a máquina se não houver itens associados
    const deletedMaquina = await Maquina.delete({
      where: {
        id_maquina: maquinaId,
      },
    });

    console.log(`Máquina com ID ${maquinaId} deletada com sucesso.`);
  } catch (error) {
    console.error("Erro ao deletar a máquina no controlador:", error);
    // Lança o erro novamente para que seja capturado no local onde a função deleteMaquina é chamada
    throw error;
  }
}

export default AdmController;
export { deleteMaquina };
