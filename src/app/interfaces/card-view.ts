import { Card } from "@entities";

export interface CardView {
    name: string | undefined;
    numberOfCards: Number;
    cards: Card[];
}