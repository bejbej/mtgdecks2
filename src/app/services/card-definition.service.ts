import { Injectable } from "@angular/core";
import * as app from "@app";

declare var cardsCSV: string;

@Injectable({
    providedIn: "root"
})
export class CardDefinitionService {

    private _cards: { [id: string]: app.CardDefinition };

    constructor() {
        this._cards = cardsCSV.split("\n").slice(1).reduce((dictionary, cardText) => {
            let parameters = cardText.split("\t");
            let card = {
                name: parameters[0],
                primaryType: parameters[1],
                cmc: Number(parameters[2]),
                color: parameters[3],
                imageUri: parameters[4]
            };
            dictionary[card.name.toLowerCase()] = card;
            return dictionary;
        }, {});
    }

    getCards = () => this._cards;
}
