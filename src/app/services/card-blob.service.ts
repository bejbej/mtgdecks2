import { inject, Injectable } from "@angular/core";
import * as app from "@app";
import { toArray } from "@dictionary";
import { Dictionary } from "@types";
import { hasLength } from "../common/has-length";

export interface parseCardBlobResult {
    cards: app.Card[],
    invalidCards: string[]
}

@Injectable({
    providedIn: "root"
})
export class CardBlobService {

    private cardDefinitionService = inject(app.CardDefinitionService);

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
            if (/^\/\//.test(line)) {
                continue;
            }

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
            .concat(cards.map(card => `${card.quantity}x ${card.definition.name}`))
            .join("\n");
    }

    stringify2(cardViews: app.CardView[], invalidCards: string[]): string {
        const sections = [];

        if (hasLength(invalidCards)) {
            sections.push(invalidCards.join("\n"))
        }

        for (let cardView of cardViews) {
            const section = [];
            if (hasLength(cardView.name)) {
                section.push(`// ${cardView.name}`);
            }
            for (let card of cardView.cards) {
                section.push(`${card.quantity}x ${card.definition.name}`);
            }
            sections.push(section.join("\n"));
        }

        return sections.join("\n\n");
    }
}