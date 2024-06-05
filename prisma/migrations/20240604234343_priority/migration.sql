/*
  Warnings:

  - You are about to drop the column `prioridade` on the `Item_Maquina` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN "prioridade" INTEGER;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item_Maquina" (
    "id_item_maquina" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prazo" TEXT,
    "ordem" INTEGER,
    "executor" TEXT,
    "finalizado" BOOLEAN NOT NULL DEFAULT false,
    "corte" TEXT,
    "maquinaId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    CONSTRAINT "Item_Maquina_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "Maquina" ("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_Maquina_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id_item") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item_Maquina" ("corte", "executor", "finalizado", "id_item_maquina", "itemId", "maquinaId", "ordem", "prazo") SELECT "corte", "executor", "finalizado", "id_item_maquina", "itemId", "maquinaId", "ordem", "prazo" FROM "Item_Maquina";
DROP TABLE "Item_Maquina";
ALTER TABLE "new_Item_Maquina" RENAME TO "Item_Maquina";
PRAGMA foreign_key_check("Item_Maquina");
PRAGMA foreign_keys=ON;
