import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Observable, of } from "rxjs";
import * as app from "@app";

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

    getCardPrices = (cardNames: string[]): app.Cancellable<app.CardPrice[]> => {
        cardNames = cardNames.map(cardName => cardName.toLowerCase());
        let knownCards = this.getKnownCards(cardNames);
        let unknownCardNames = cardNames.except(knownCards.map(card => card.name));
        let observable = this.getUnknownCards(unknownCardNames)
            .pipe(map(unknownCards => {
                let now = new Date().getTime().toString();
                unknownCards.forEach(card => card.modifiedOn = now);
                this.save(unknownCards);
                return knownCards.concat(unknownCards);
            }));
        return app.Cancellable.fromObservable(observable);
    }

    private getCache = (): app.CardPrice[] => {
        let cache = localStorage.getItem(this.key);
        return cache ? app.CSV.parse(cache, "\t") : [];
    }

    private setCache = (cards: app.CardPrice[]): void => {
        localStorage.setItem(this.key, app.CSV.stringify(cards, ["name", "usd", "modifiedOn"], "\t"));
    }

    private getKnownCards = (cardNames: string[]): app.CardPrice[] => {
        if (cardNames.length === 0 || this.cardCacheLimit === 0 || this.expirationMs === 0) {
            return [];
        }

        let cutoffDate = new Date().getTime() - this.expirationMs;
        let knownCards = app.Dictionary.fromArray(<app.CardPrice[]>this.getCache(), card => card.name);
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

        let csv = cardNames.join("\n");
        let config = {
            responseType: "text" as "text",
            headers: {
                "Content-Type": "application/text"
            }
        };
        
        return this.http.post(this.url, csv, config)
            .pipe(map(response => app.CSV.parse(response, "\t")));
    }

    private save = (newCards: app.CardPrice[]): void => {
        if (newCards.length === 0 || this.cardCacheLimit === 0 || this.expirationMs === 0) {
            return;
        }

        let cutoffDate = new Date().getTime() - this.expirationMs;
        let cardDict = (<app.CardPrice[]>this.getCache()).reduce<{ [id: string]: app.CardPrice }>((dictionary, card) => {
            if (Number(card.modifiedOn) > cutoffDate) {
                dictionary[card.name] = card;
            }

            return dictionary;
        }, {});
        newCards.forEach(card => cardDict[card.name] = card);
        let cards = app.Dictionary.toArray(cardDict);
        if (cards.length > this.cardCacheLimit) {
            cards = cards.sort((a, b) => Number(a.modifiedOn) < Number(b.modifiedOn) ? 1 : -1)
            cards.splice(this.cardCacheLimit);
        }

        this.setCache(cards);
    }
}
