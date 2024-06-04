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
  async changeItemStatusProduzindo(itemId, maquinaId, prazo, ordem, corte) {
    try {
      await Item.update({
        where: { id_item: itemId },
        data: { status: "PRODUZINDO" },
      });

      await Item_Maquina.create({
        data: {
          maquinaId: maquinaId,
          itemId: itemId,
          prazo: prazo, // Adicionando prazo ao criar o registro
          ordem: ordem, // Adicionando ordem ao criar o registro
          corte: corte, // Adicionando corte ao criar o registro
        },
      });

      console.log(`Item ${itemId} atualizado para status PRODUZINDO com prazo ${prazo} e ordem ${ordem} e corte ${corte}`);
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
          ordem: item_maquina.ordem // Inclui a coluna "ordem"
        };
      });
    } catch (error) {
      throw new Error("Erro ao buscar itens para a máquina: " + error.message);
    }
  }

  
}

export default AdmController;
