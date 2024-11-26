import * as app from "@app";
import { Dictionary } from "@types";
import { Injectable } from "@angular/core";
import { toDictionary } from "@dictionary";

declare var cardsCSV: string;

@Injectable({
    providedIn: "root"
})
export class CardDefinitionService {

    private _cardDictionary: Dictionary<app.CardDefinition>;
    private _cardArray: app.CardDefinition[];

    constructor() {
        const items = cardsCSV.split(/[\t\n]/);
        const cards: app.CardDefinition[] = [];
        for (let i = 7; i < items.length; i = i + 7) {
            cards.push({
                name: items[i],
                primaryType: items[i+1],
                manaValue: Number(items[i+2]),
                color: items[i+3],
                isDoubleSided: items[i+4] === "1",
                price: Number(items[i+5]),
                imageId: items[i+6]
            });
        }

        this._cardArray = cards;
        this._cardDictionary = toDictionary(this._cardArray, card => card.name.toLowerCase());
        
        // Free up memory maybe
        cardsCSV = undefined;
    }

    getCardDictionary = () => this._cardDictionary;
    getCardArray = () => this._cardArray;
}
