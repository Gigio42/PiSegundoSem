import { EntitySchema } from "typeorm";

const Chapa_Item = new EntitySchema({
    name: "Chapa_Item",
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true
        },
    },
    relations: {
        chapa: {
            target: "Chapas",
            type: 'many-to-one',
            inverseSide: 'chapaItems',
        },
        item: {
            target: "Item",
            type: 'many-to-one',
            inverseSide: 'chapaItems',
        }
    }
});

export default Chapa_Item;