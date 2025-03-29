import * as app from "@app";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { noop, Observable, of } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class DeckService {

    private localStorageService = inject(app.LocalStorageService);
    private cardBlobService = inject(app.CardBlobService);
    private http = inject(HttpClient);

    private _url = app.config.decksUrl;

    getById(id: string): Observable<app.Deck> {
        if (id === "new") {
            return of(this.createDefaultDeck());
        }

        return this.http.get<app.ApiDeck>(this._url + "/" + id)
            .pipe(map(x => this.mapApiDeckToDeck(x)));
    }

    getByQuery(query?): Observable<app.QueriedDeck[]> {
        return this.http.get<{ results: app.QueriedDeck[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
    }

    createDeck(deck: app.Deck): Observable<string> {
        return this.http.post<{ id: string }>(this._url, this.mapDeckToApiDeck(deck))
            .pipe(map(response => response.id));
    }

    updateDeck(deck: app.Deck): Observable<void> {
        let url = this._url + "/" + deck.id;
        return this.http.put(url, this.mapDeckToApiDeck(deck)).pipe(map(noop));
    }

    deleteDeck(id: string): Observable<void> {
        let url = this._url + "/" + id;
        return this.http.delete(url).pipe(map(noop));
    }

    private mapApiDeckToDeck(apiDeck: app.ApiDeck): app.Deck {
        const cardGroups = {};
        for (let i = 0; i < apiDeck.cardGroups.length; ++i) {
            const parsedCardBlob = this.cardBlobService.parse(apiDeck.cardGroups[i].cardBlob);
            cardGroups[i] = {
                ...parsedCardBlob,
                name: apiDeck.cardGroups[i].name
            };
        }

        return {
            ...apiDeck,
            cardGroups: cardGroups,
            cardGroupOrder: Object.keys(cardGroups).map(x => Number(x))
        }
    }

    private mapDeckToApiDeck(deck: app.Deck): app.ApiDeck {
        const cardGroups = deck.cardGroupOrder
            .map(key => deck.cardGroups[key])
            .map(cardGroup => {
                const cardBlob = this.cardBlobService.stringify(cardGroup.cards, cardGroup.invalidCards);
                return {
                    name: cardGroup.name,
                    cardBlob: cardBlob
                };
            });

        return {
            name: deck.name,
            notes: deck.notes,
            owners: deck.owners,
            tags: deck.tags,
            id: deck.id,
            cardGroups: cardGroups,
        };
    }

    private createDefaultDeck(): app.Deck {
        const tags = [] as string[];
        const tagState = this.localStorageService.getObject<app.TagState>(app.config.localStorage.tags);
        if (tagState && tagState.current) {
            tags.push(tagState.current);
        }

        return {
            cardGroups: {
                0 : {
                    cards: [],
                    invalidCards: [],
                    name: "Mainboard",
                }
            },
            id: undefined,
            cardGroupOrder: [0],
            name: "New Deck",
            notes: "",
            owners: [],
            tags: tags
        };
    }
}
