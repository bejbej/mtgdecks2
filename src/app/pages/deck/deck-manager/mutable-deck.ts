import { signal, WritableSignal } from "@angular/core";
import { Card, Deck } from "@entities";
import { isNotDefined } from "@utilities";

export class MutableDeck {
    id: WritableSignal<string> = signal("");
    name: WritableSignal<string> = signal("");
    owners: WritableSignal<string[]> = signal([]);
    notes: WritableSignal<string> = signal("");
    tags: WritableSignal<string[]> = signal([]);
    cardGroups: WritableSignal<MutableCardGroup[]> = signal([]);

    constructor(deck: Deck | undefined = undefined) {
        if (isNotDefined(deck)) {
            return;
        }

        this.id.set(deck.id);
        this.name.set(deck.name);
        this.notes.set(deck.notes);
        this.owners.set(deck.owners);
        this.tags.set(deck.tags);

        const cardGroups = deck.cardGroups.map(cardGroup => {
            return {
                name: signal(cardGroup.name),
                cards: signal(cardGroup.cards),
                invalidCards: signal(cardGroup.invalidCards)
            } as MutableCardGroup;
        });

        this.cardGroups.set(cardGroups);
    }

    toDeck(): Deck {
        return {
            id: this.id(),
            name: this.name(),
            notes: this.notes(),
            owners: this.owners(),
            tags: this.tags(),
            cardGroups: this.cardGroups().map(cardGroup => {
                return {
                    cards: cardGroup.cards(),
                    invalidCards: cardGroup.invalidCards(),
                    name: cardGroup.name()
                }
            })
        }
    }
}

export interface MutableCardGroup {
    name: WritableSignal<string>;
    cards: WritableSignal<Card[]>;
    invalidCards: WritableSignal<string[]>;
}