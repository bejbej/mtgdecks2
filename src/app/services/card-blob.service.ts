import * as app from "@app";
import { Dictionary } from "@types";
import { Injectable } from "@angular/core";
import { toArray } from "@dictionary";

export interface parseCardBlobResult {
    cards: app.Card[],
    invalidCards: string[]
}

@Injectable({
    providedIn: "root"
})
export class CardBlobService {

    constructor(private cardDefinitionService: app.CardDefinitionService) {}

    parse(cardBlob: string): parseCardBlobResult {
        cardBlob = cardBlob.trim();
        
        if (cardBlob.length === 0) {
            return {
                cards: [],
                invalidCards: []
            };
        }
        
        const invalidCards: string[] = [];
        const cardDict: Dictionary<app.Card> = {};
    
        for (let line of cardBlob.split(/\n[\s\n]*/)) {
            const result = /^(?:(\d+)[Xx]?\s)?\s*([^0-9]+)$/.exec(line.trim());
            if (!result) {
                invalidCards.push(line);
                continue;
            }
    
            const cardDefinition = this.cardDefinitionService.getCardDictionary()[result[2].toLowerCase()];
            if (!cardDefinition) {
                invalidCards.push(line);
                continue;
            }
    
            const card = cardDict[cardDefinition.name] = cardDict[cardDefinition.name] || { definition: cardDefinition, quantity: 0 };
            card.quantity += Number(result[1]) || 1;
        };
    
        return {
            cards: toArray(cardDict),
            invalidCards: invalidCards
        };
    }
    
    stringify(cards: app.Card[], invalidCards: string[]): string {
        return invalidCards 
            .concat(cards
                //.sort((a, b) => a.definition.name > b.definition.name ? 1 : -1)
                .map(card => `${card.quantity}x ${card.definition.name}`))
            .join("\n");
    }
}