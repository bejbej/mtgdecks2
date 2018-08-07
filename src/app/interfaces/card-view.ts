import * as app from "@app";

export interface CardView {
    name: string;
    numberOfCards: Number;
    cards: app.Card[];
}