import { Injectable } from "@angular/core";
import { CardDefinition } from "@entities";
import { Dictionary } from "@types";
import { toDictionary } from "@utilities";

declare var cardsCSV: string;

@Injectable({
    providedIn: "root"
})
export class CardDefinitionService {

    private cardDictionary: Dictionary<CardDefinition>;
    private cardArray: CardDefinition[];

    constructor() {
        const items = cardsCSV.split(/[\t\n]/);
        const cards: CardDefinition[] = [];
        for (let i = 7; i < items.length; i = i + 7) {
            cards.push({
                name: items[i],
                primaryType: items[i + 1],
                manaValue: Number(items[i + 2]),
                color: items[i + 3],
                isDoubleSided: items[i + 4] === "1",
                price: Number(items[i + 5]),
                imageId: items[i + 6]
            });
        }

        this.cardArray = cards;
        this.cardDictionary = toDictionary(this.cardArray, card => card.name.toLowerCase());

        // Free up memory maybe
        cardsCSV = undefined;
    }

    getCardDictionary = () => this.cardDictionary;
    getCardArray = () => this.cardArray;
}
