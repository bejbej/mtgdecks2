import { Card, CardView } from "@entities";
import { sum } from "@utilities";

export type GroupFunc = (cards: Card[]) => CardView[];

export class CardGrouper {
    static groupByType: GroupFunc = (cards: Card[]): CardView[] => {
        return CardGrouper.groupBy(
            ["creature", "artifact", "enchantment", "battle", "planeswalker", "land", "instant", "sorcery", "conspiracy"],
            x => x,
            card => card.definition.primaryType,
            cards
        );
    }

    static groupByManaValue: GroupFunc = (cards: Card[]): CardView[] => {
        return CardGrouper.groupBy(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            x => x + " drop",
            card => card.definition.manaValue,
            cards
        );
    }

    static groupByColor: GroupFunc = (cards: Card[]): CardView[] => {
        return CardGrouper.groupBy(
            ["white", "blue", "black", "red", "green", "multicolored", "colorless"],
            x => x,
            card => card.definition.color,
            cards
        );
    }

    static groupByName: GroupFunc = (cards: Card[]): CardView[] => {
        const sortedCards = cards
            .slice()
            .sort((a, b) => a.definition.name > b.definition.name ? 1 : -1);

        return [{
            name: undefined,
            numberOfCards: undefined,
            cards: sortedCards
        }];
    }

    static groupByPrice: GroupFunc = (cards: Card[]): CardView[] => {
        const sortedCards = cards
            .slice()
            .sort((a, b) => (a.definition.price || 0) > (b.definition.price || 0) ? 1 : -1);

        return [{
            name: undefined,
            numberOfCards: undefined,
            cards: sortedCards
        }];
    }

    private static groupBy = (
        keys: any[],
        headerFunc: (key: string) => string,
        keyFunc: (card: Card) => string | number,
        cards: Card[]): CardView[] => {

        let cardDictionary: { [id: string]: Card[] } = cards.reduce((dictionary, card) => {
            let key = keyFunc(card);
            dictionary[key] = dictionary[key] || [];
            dictionary[key].push(card);
            return dictionary;
        }, {});

        return keys.reduce<CardView[]>((array, key) => {
            let cards = cardDictionary[key] || [];

            if (cards && cards.length > 0) {
                cards = cards.sort((a, b) => a.definition.name > b.definition.name ? 1 : -1);
                array.push({
                    name: headerFunc(key),
                    cards: cards,
                    numberOfCards: sum(cards, card => card.quantity)
                });
            }

            return array;
        }, []);
    }
}
