export interface Card {
    quantity: number;
    definition: CardDefinition;
    usd: number;
}

export interface CardDefinition {
    name: string;
    primaryType: string;
    color: string;
    imageUri: string;
    cmc: number;
}
