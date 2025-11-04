export interface Deck {
    id: string;
    name: string;
    owners: string[];
    notes: string;
    tags: string[];
    cardGroups: CardGroup[];
}

export interface CardGroup {
    name: string;
    cards: Card[];
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
    manaValue: number;
    price: number;
    imageId: string;
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
