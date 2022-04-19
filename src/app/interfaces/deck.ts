import * as app from "@app";

export interface Deck {
    id: string;
    name: string;
    cardGroups: CardGroup[];
    owners: string[];
    notes: string;
    tags: string[];
}

export interface CardGroup {
    name: string;
    cards: app.Card[];
    invalidCards: string[];
}

export interface ApiDeck {
    id: string;
    name: string;
    cardGroups: {
        name: string;
        cardBlob: string;
    }[];
    owners: string[];
    notes: string;
    tags: string[];
}