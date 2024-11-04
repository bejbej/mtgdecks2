import * as app from "@app";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class DeckService {

    private _url = app.config.decksUrl;

    constructor(private cardBlobService: app.CardBlobService, private http: HttpClient) { }

    getById(id: string): Observable<app.Deck> {
        return this.http.get<app.ApiDeck>(this._url + "/" + id)
            .pipe(map(x => this.mapApiDeckToDeck(x)));
    }

    getByQuery(query?): Observable<any[]> {
        return this.http.get<{ results: Object[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
    }

    createDeck(deck: app.Deck): Observable<string> {
        return this.http.post<{ id: string }>(this._url, this.mapDeckToApiDeck(deck))
            .pipe(map(response => response.id));
    }

    updateDeck(deck: app.Deck): Observable<any> {
        let url = this._url + "/" + deck.id;
        return this.http.put(url, this.mapDeckToApiDeck(deck));
    }

    deleteDeck(id: string): Observable<any> {
        let url = this._url + "/" + id;
        return this.http.delete(url);
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
}
