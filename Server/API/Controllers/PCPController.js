//Detalhes: As funções de deletar eu usei o prisma.$transaction por achar que seria mais seguro, pois
//se uma das operações falhar, ele vai dar rollback
import Chapas from "../Models/chapasModel.js";
import Chapa_Item from "../Models/chapa_itemModel.js";
import Item from "../Models/itemModel.js";
import Conjugacoes from "../Models/conjugacoesModel.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class PCPController {
  constructor() {}

  // ------------------------------
  // GetChapas Function
  // ------------------------------
  async getChapas(query, filterCriteria, sortOrder, sortBy) {
    let data = await Chapas.findMany({ include: { conjugacoes: true } });

    data = data.filter((chapa) => chapa.quantidade_disponivel > 0 && !chapa.conjugado);

    if (filterCriteria) {
      for (let key in filterCriteria) {
        if (key === "comprimento" || key === "largura") {
          const filterValue = parseInt(filterCriteria[key]);
  
          data = data.filter((chapa) => {
            let isValid = chapa.conjugacoes.some((conjugacao) => {
              if (key === "comprimento") {
                return conjugacao.comprimento === filterValue;
              } else {
                return conjugacao.largura === filterValue;
              }
            });
  
            if (key === "comprimento") {
              isValid = isValid || chapa.comprimento === filterValue;
            } else {
              isValid = isValid || chapa.largura === filterValue;
            }
  
            return isValid;
          });
        } else {
          data = data.filter((chapa) => chapa[key].toLowerCase() === filterCriteria[key].toLowerCase());
        }
      }
    }

    const sortedChapas = data.sort((a, b) => {
      const getValue = (obj, prop) => prop.split(".").reduce((acc, part) => acc && acc[part], obj);

      if (sortOrder === "descending") {
        return getValue(a, sortBy) < getValue(b, sortBy) ? -1 : getValue(a, sortBy) > getValue(b, sortBy) ? 1 : 0;
      } else {
        return getValue(a, sortBy) > getValue(b, sortBy) ? -1 : getValue(a, sortBy) < getValue(b, sortBy) ? 1 : 0;
      }
    });

    return sortedChapas;
  }

  // ------------------------------
  // GetItemsComment Function
  // ------------------------------
  async getItems(searchQuery = "") {
    const chapaItems = await Chapa_Item.findMany({
      where: { item: { part_number: { contains: searchQuery } } },
      include: { item: true, chapa: { include: { conjugacoes: true } } },
    });

    if (!chapaItems.length) throw new Error(`Chapas não encontradas para o item ${searchQuery}`);

    const items = chapaItems.reduce((acc, { item, chapa }) => {
      acc[item.id_item] = acc[item.id_item] || { ...item, chapas: [] };

      if (!acc[item.id_item].chapas.some(({ id_chapa }) => id_chapa === chapa.id_chapa)) {
        acc[item.id_item].chapas.push(chapa);
      }

      return acc;
    }, {});

    return Object.values(items);
  }

  // ------------------------------
  // PostItemsComment Function
  // ------------------------------
  async validateQuantities(chapas, conjugacoes) {
    chapas.forEach(({ quantity }) => {
      if (!quantity) throw new Error("Todas as chapas devem ter uma quantidade");
    });

    conjugacoes.forEach(({ quantity }) => {
      if (!quantity) throw new Error("Todas as conjugacoes devem ter uma quantidade");
    });
  }

  async findOrCreateItem(partNumber, pedidoVenda, reservedBy) {
    let item = await Item.findUnique({ where: { part_number: partNumber } });

    if (!item) {
      item = await Item.create({
        data: {
          part_number: partNumber,
          pedido_venda: parseInt(pedidoVenda),
          status: "RESERVADO",
          reservado_por: reservedBy,
        },
      });
    } else if (item.status !== "RESERVADO") {
      throw new Error("Item em processo");
    }

    return item;
  }

  async updateChapa(chapaID, quantity) {
    const chapa = await Chapas.findUnique({ where: { id_chapa: chapaID } });

    if (!chapa) throw new Error("Chapa não encontrada");
    if (!quantity || quantity <= 0) throw new Error("Informe a quantidade de chapas a serem reservadas");
    if (quantity > chapa.quantidade_disponivel) throw new Error(`Chapa ${chapaID} não possui quantidade suficiente`);

    const updatedChapa = await Chapas.update({
      where: { id_chapa: chapa.id_chapa },
      data: {
        quantidade_disponivel: { decrement: parseInt(quantity) },
        quantidade_estoque: { decrement: parseInt(quantity) },
      },
    });

    return chapa;
  }

  async updateConjugacao(conjugacoesID, quantity) {
    const conjugacao = await Conjugacoes.findUnique({ where: { id_conjugacoes: conjugacoesID } });
    const chapa = await Chapas.findUnique({ where: { id_chapa: conjugacao.chapaId } });

    if (!conjugacao) throw new Error("Conjugação não encontrada");
    if (!quantity || quantity <= 0) throw new Error("Informe a quantidade de conjugações a serem reservadas");
    if (quantity > conjugacao.quantidade_disponivel) throw new Error(`Conjugação ${conjugacoesID} não possui quantidade suficiente`);
    if (!chapa) throw new Error("Chapa não encontrada");

    await Conjugacoes.update({
      where: { id_conjugacoes: conjugacao.id_conjugacoes },
      data: {
        quantidade_disponivel: { decrement: parseInt(quantity) },
        usado: parseInt(quantity) === conjugacao.quantidade_disponivel,
      },
    });

    const allConjugacoes = await Conjugacoes.findMany({ where: { chapaId: conjugacao.chapaId } });
    const allUsed = allConjugacoes.every((c) => c.usado);

    if (allUsed) {
      await Chapas.update({
        where: { id_chapa: conjugacao.chapaId },
        data: { quantidade_disponivel: 0 },
      });
    }

    return conjugacao;
  }

  async upsertChapaItem(chapaID, itemID, quantity, conjugacoesID = null) {
    const whereCondition = {
      AND: [{ chapa: { id_chapa: chapaID } }, { item: { id_item: itemID } }],
    };

    if (conjugacoesID) {
      whereCondition.AND.push({ conjugacao: { id_conjugacoes: conjugacoesID } });
    }

    let chapaItem = await Chapa_Item.findFirst({ where: whereCondition });

    if (chapaItem) {
      await Chapa_Item.update({
        where: { id_chapa_item: chapaItem.id_chapa_item },
        data: {
          quantidade: { increment: Number(quantity) },
          ...(conjugacoesID && { conjugacao: { connect: { id_conjugacoes: conjugacoesID } } }),
        },
      });
    } else {
      await Chapa_Item.create({
        data: {
          quantidade: Number(quantity),
          chapa: { connect: { id_chapa: chapaID } },
          item: { connect: { id_item: itemID } },
          ...(conjugacoesID && { conjugacao: { connect: { id_conjugacoes: conjugacoesID } } }),
        },
      });
    }
  }

  async createItemWithChapa(body) {
    const { partNumber, pedidoVenda, chapas, conjugacoes, reservedBy } = body;

    const hoje = new Date();
    const dataFormatada = [
      hoje.getDate().toString().padStart(2, "0"), // dia
      (hoje.getMonth() + 1).toString().padStart(2, "0"), // mês (getMonth() retorna de 0 a 11)
      hoje.getFullYear(), // ano
    ].join("/");

    try {
      console.log(body);
      await this.validateQuantities(chapas, conjugacoes);

      // Verificar quantidades antes de qualquer inserção
      for (const { chapaID, quantity } of chapas) {
        const chapa = await Chapas.findUnique({ where: { id_chapa: chapaID } });
        if (!chapa) throw new Error("Chapa não encontrada");
        if (quantity > chapa.quantidade_disponivel) throw new Error(`Chapa ${chapaID} não possui quantidade suficiente`);
      }

      for (const { conjugacoesID, quantity } of conjugacoes) {
        const conjugacao = await Conjugacoes.findUnique({ where: { id_conjugacoes: conjugacoesID } });
        if (!conjugacao) throw new Error("Conjugação não encontrada");
        if (quantity > conjugacao.quantidade_disponivel) throw new Error(`Conjugação ${conjugacoesID} não possui quantidade suficiente`);
      }

      const item = await this.findOrCreateItem(partNumber, pedidoVenda, reservedBy);

      for (const { chapaID, quantity } of chapas) {
        await this.updateChapa(chapaID, quantity);
        await this.upsertChapaItem(chapaID, item.id_item, quantity);

        const chapa = await prisma.chapas.findUnique({
          where: { id_chapa: chapaID },
        });

        await prisma.historico.create({
          data: {
            chapa: `${chapa.largura} X ${chapa.comprimento} - ${chapa.vincos} - ${chapa.qualidade}/${chapa.onda}`,
            part_number: partNumber,
            quantidade: quantity,
            modificacao: "RESERVADO",
            modificado_por: reservedBy,
            data_modificacao: dataFormatada,
            pedido_venda: pedidoVenda,
          },
        });
      }

      for (const { conjugacoesID, quantity } of conjugacoes) {
        const conjugacao = await this.updateConjugacao(conjugacoesID, quantity);
        await this.upsertChapaItem(conjugacao.chapaId, item.id_item, quantity, conjugacoesID);

        const conjugacaoID = await prisma.conjugacoes.findUnique({
          where: { id_conjugacoes: conjugacoesID },
        });

        const chapa = await prisma.chapas.findUnique({
          where: { id_chapa: conjugacaoID.chapaId },
        });

        await prisma.historico.create({
          data: {
            chapa: `${chapa.largura} X ${chapa.comprimento} - ${chapa.vincos} - ${chapa.qualidade}/${chapa.onda}`,
            part_number: partNumber,
            quantidade: parseInt(quantity),
            conjugacao: `${conjugacao.largura} X ${conjugacao.comprimento}`,
            modificacao: "RESERVADO",
            modificado_por: reservedBy, // usuario login
            data_modificacao: dataFormatada,
            pedido_venda: pedidoVenda,
          },
        });
      }

      return item;
    } catch (error) {
      console.error("Erro ao criar item com chapa:", error);
      throw new Error(error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  // ------------------------------
  // delete item
  // ------------------------------
  async deleteItem(itemId, reservedBy, dataFormatada) {
    const item = await prisma.item.findUnique({
      where: { id_item: itemId },
      include: { chapas: true },
    });

    if (!item) {
      throw new Error("Item não encontrado");
    }

    const operations = [];
    const partNumber = item.part_number;
    const pedidoVenda = item.pedido_venda !== null && item.pedido_venda !== undefined ? item.pedido_venda.toString() : "N/A";

    for (const chapaItem of item.chapas) {
      const conjugacoes = await prisma.conjugacoes.findMany({ where: { chapaId: chapaItem.chapaId } });

      let conjugacaoStr = conjugacoes.map((conjugacao) => `${conjugacao.largura} X ${conjugacao.comprimento}`).join(", ");

      for (const conjugacao of conjugacoes) {
        operations.push(
          prisma.conjugacoes.update({
            where: { id_conjugacoes: conjugacao.id_conjugacoes },
            data: {
              quantidade_disponivel: { increment: chapaItem.quantidade },
              usado: false,
            },
          })
        );
      }

      const chapa = await prisma.chapas.findUnique({
        where: { id_chapa: chapaItem.chapaId },
      });

      const chapaUpdateData = {
        quantidade_estoque: { increment: chapaItem.quantidade },
        quantidade_disponivel: { increment: chapaItem.quantidade },
      };

      operations.push(
        prisma.chapas.update({
          where: { id_chapa: chapaItem.chapaId },
          data: chapaUpdateData,
        })
      );

      operations.push(prisma.chapa_Item.delete({ where: { id_chapa_item: chapaItem.id_chapa_item } }));

      const quantidade = chapaItem.quantidade !== undefined && chapaItem.quantidade !== null ? parseInt(chapaItem.quantidade) : 0;
      console.log("chapaItem qtd", quantidade);

      operations.push(
        prisma.historico.create({
          data: {
            chapa: `${chapa.largura} X ${chapa.comprimento} - ${chapa.vincos} - ${chapa.qualidade}`,
            part_number: partNumber,
            quantidade: quantidade,
            conjugacao: conjugacaoStr,
            modificacao: "Chapa removida do item",
            modificado_por: reservedBy,
            data_modificacao: dataFormatada,
            pedido_venda: pedidoVenda,
          },
        })
      );
    }

    operations.push(prisma.item.delete({ where: { id_item: itemId } }));

    const itemQuantidade = item.quantidade !== undefined && item.quantidade !== null ? parseInt(item.quantidade) : 0;
    operations.push(
      prisma.historico.create({
        data: {
          part_number: partNumber,
          quantidade: itemQuantidade,
          modificacao: "Item deletado",
          modificado_por: reservedBy,
          data_modificacao: dataFormatada,
          pedido_venda: pedidoVenda,
        },
      })
    );

    await prisma.$transaction(operations);
  }

  // ------------------------------
  // delete chapa from item
  // ------------------------------
  async deleteChapaFromItem(itemId, chapaId, reservedBy, dataFormatada) {
    const chapaItem = await Chapa_Item.findFirst({
      where: {
        itemId: itemId,
        chapaId: chapaId,
      },
    });

    if (!chapaItem) {
      throw new Error("Chapa não encontrada no item");
    }

    const operations = [];

    const conjugacoes = await Conjugacoes.findMany({ where: { chapaId: chapaId } });

    let conjugacaoStr = conjugacoes.map((conjugacao) => `${conjugacao.largura} X ${conjugacao.comprimento}`).join(", ");

    const chapa = await Chapas.findUnique({
      where: { id_chapa: chapaId },
    });

    const chapaUpdateData = {
      quantidade_estoque: { increment: chapaItem.quantidade },
      quantidade_disponivel: { increment: chapaItem.quantidade },
    };

    operations.push(
      Chapas.update({
        where: { id_chapa: chapaId },
        data: chapaUpdateData,
      })
    );

    operations.push(Chapa_Item.delete({ where: { id_chapa_item: chapaItem.id_chapa_item } }));

    const item = await Item.findUnique({ where: { id_item: itemId } });
    const partNumber = item.part_number;
    const pedidoVenda = item.pedido_venda;

    operations.push(
      prisma.historico.create({
        data: {
          chapa: `${chapa.largura} X ${chapa.comprimento} - ${chapa.vincos} - ${chapa.qualidade}/${chapa.onda}`,
          part_number: partNumber,
          quantidade: parseInt(chapaItem.quantidade),
          conjugacao: conjugacaoStr,
          modificacao: "Chapa removida do item",
          modificado_por: reservedBy,
          data_modificacao: dataFormatada,
          pedido_venda: toString(pedidoVenda),
        },
      })
    );

    await prisma.$transaction(operations);
  }
}

export default PCPController;
