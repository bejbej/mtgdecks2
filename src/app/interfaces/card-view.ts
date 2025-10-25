import { Card } from "@entities";

export interface CardView {
    name: string;
    numberOfCards: Number;
    cards: Card[];
}