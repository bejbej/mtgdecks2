import { inject, Injectable } from "@angular/core";
import { Card, CardView } from "@entities";
import { Dictionary, hasLength, hasNoLength } from "@utilities";
import { CardDefinitionService } from "./card-definition.service";

export interface parseCardBlobResult {
    cards: Card[],
    invalidCards: string[]
}

@Injectable({
    providedIn: "root"
})
export class CardBlobService {

    private cardDefinitionService = inject(CardDefinitionService);

    parse(cardBlob: string): parseCardBlobResult {
        cardBlob = cardBlob.trim();

        if (hasNoLength(cardBlob)) {
            return {
                cards: [],
                invalidCards: []
            };
        }

        const invalidCards: string[] = [];
        const cardDict: Dictionary<string, Card> = {};

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
            cards: Object.values(cardDict),
            invalidCards: invalidCards
        };
    }

    stringify(cards: Card[], invalidCards: string[]): string {
        return invalidCards
            .concat(cards.map(card => `${card.quantity}x ${card.definition.name}`))
            .join("\n");
    }

    stringify2(cardViews: CardView[], invalidCards: string[]): string {
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