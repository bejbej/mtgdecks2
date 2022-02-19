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
        this._cardArray = cardsCSV.split("\n").slice(1).map(cardText => {
            const parameters = cardText.split("\t");
            return {
                name: parameters[0],
                primaryType: parameters[1],
                cmc: Number(parameters[2]),
                color: parameters[3],
                imageUri: parameters[4],
                isDoubleSided: parameters[5] === "1"
            }
        });
        this._cardDictionary = toDictionary(this._cardArray, card => card.name.toLowerCase());
    }

    getCardDictionary = () => this._cardDictionary;
    getCardArray = () => this._cardArray;
}
