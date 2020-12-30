import * as app from "@app";
import { Injectable } from "@angular/core";
import { toDictionary } from "@dictionary";

declare var cardsCSV: string;

@Injectable({
    providedIn: "root"
})
export class CardDefinitionService {

    private _cardDictionary: { [id: string]: app.CardDefinition };
    private _cardArray: app.CardDefinition[];

    constructor() {
        let cardArray = cardsCSV.split("\n").slice(1).map(cardText => {
            let parameters = cardText.split("\t");
            return {
                name: parameters[0],
                primaryType: parameters[1],
                cmc: Number(parameters[2]),
                color: parameters[3],
                scryfallId: parameters[4]
            }
        });
        this._cardDictionary = toDictionary(cardArray, card => card.name.toLowerCase());
        this._cardArray = Object.keys(this._cardDictionary).sort().map(key => this._cardDictionary[key]);
    }

    getCardDictionary = () => this._cardDictionary;
    getCardArray = () => this._cardArray;
}
