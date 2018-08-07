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
    cardBlob: string;
}
