import BASE_URL from "../../utils/config.js";

export async function fetchMaquinaData(name) {
  try {
    const response = await axios.get(`${BASE_URL}/producao/maquina/${name}/itens/chapas`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function updateItemStatus(itemId, maquinaName) {
  try {
    const response = await axios.put(`${BASE_URL}/producao/item/${itemId}/maquina/${maquinaName}`);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
}
