import * as app from "@app";
import { Dictionary } from "@types";

export interface Deck {
    id: string;
    name: string;
    cardGroups: Dictionary<CardGroup>;
    cardGroupOrder: number[];
    owners: string[];
    notes: string;
    tags: string[];
}

export interface CardGroup {
    name: string;
    cards: app.Card[];
    invalidCards: string[];
}

export interface Card {
    definition: CardDefinition;
    quantity: number;
}

export interface CardDefinition {
    name: string;
    primaryType: string;
    color: string;
    cmc: number;
    price: number;
    imageUri: string;
    isDoubleSided: boolean;
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