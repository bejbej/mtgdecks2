import * as app from "@app";
import { Dictionary } from "@types";
import { except } from "@array";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable, of } from "rxjs";
import { parse, stringify } from "@csv";
import { toArray, toDictionary, toDictionary2 } from "@dictionary";

@Injectable({
    providedIn: "root"
})
export class CardPriceService {
    private expirationMs;
    private cardCacheLimit;
    private url;
    private key;

    constructor(private http: HttpClient) {
        this.url = app.config.cardsUrl;
        this.key = app.config.localStorage.cards;
        this.cardCacheLimit = app.config.cardCacheLimit || 0;
        this.expirationMs = app.config.cardExpirationMs || 0;
    }

    getCardPrices = (cardNames: string[]): Observable<Dictionary<string>> => {
        cardNames = cardNames.map(cardName => cardName.toLowerCase());
        const knownCards = this.getKnownCards(cardNames);
        const unknownCardNames = except(cardNames, knownCards.map(card => card.name));
        return this.getUnknownCards(unknownCardNames)
            .pipe(map(unknownCards => {
                const now = new Date().getTime().toString();
                for (let unknownCard of unknownCards) {
                    unknownCard.modifiedOn = now;
                }
                this.save(unknownCards);

                const cardPrices = toDictionary2(knownCards.concat(unknownCards), x => x.name, x => x.usd);
                const failedCardNames = except(unknownCardNames, unknownCards.map(x => x.name));
                for (let failedCardName of failedCardNames) {
                    cardPrices[failedCardName] = null;
                }
                
                return cardPrices;
            }));
    }

    private getCache = (): app.CardPrice[] => {
        let cache = localStorage.getItem(this.key);
        return cache ? parse(cache, "\t") : [];
    }

    private setCache = (cards: app.CardPrice[]): void => {
        localStorage.setItem(this.key, stringify(cards, ["name", "usd", "modifiedOn"], "\t"));
    }

    private getKnownCards = (cardNames: string[]): app.CardPrice[] => {
        if (cardNames.length === 0 || this.cardCacheLimit === 0 || this.expirationMs === 0) {
            return [];
        }

        let cutoffDate = new Date().getTime() - this.expirationMs;
        let knownCards = toDictionary(<app.CardPrice[]>this.getCache(), card => card.name);
        return cardNames.reduce((array, cardName) => {
            let card = knownCards[cardName];
            if (card && Number(card.modifiedOn) > cutoffDate) {
                array.push(card);
            }
            return array;
        }, []);
    }

    private getUnknownCards = (cardNames: string[]): Observable<app.CardPrice[]> => {
        if (cardNames.length === 0) {
            return of([]);
        }

        let body = cardNames.join("\n");
        let config = {
            responseType: "text" as "text",
            headers: {
                "Content-Type": "application/text"
            }
        };
        
        return this.http.post(this.url, body, config)
            .pipe(map(response => parse(response, "\t")));
    }

    private save = (newCards: app.CardPrice[]): void => {
        if (newCards.length === 0 || this.cardCacheLimit === 0 || this.expirationMs === 0) {
            return;
        }

        const cutoffDate = new Date().getTime() - this.expirationMs;
        const cardDict = (<app.CardPrice[]>this.getCache()).reduce<{ [id: string]: app.CardPrice }>((dictionary, card) => {
            if (Number(card.modifiedOn) > cutoffDate) {
                dictionary[card.name] = card;
            }

            return dictionary;
        }, {});
        
        for (let newCard of newCards) {
            cardDict[newCard.name] = newCard;
        }

        let cards = toArray(cardDict);
        if (cards.length > this.cardCacheLimit) {
            cards = cards.sort((a, b) => Number(a.modifiedOn) < Number(b.modifiedOn) ? 1 : -1);
            cards.splice(this.cardCacheLimit);
        }

        this.setCache(cards);
    }
}
