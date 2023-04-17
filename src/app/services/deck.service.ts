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
        return {
            ...apiDeck,
            cardGroups: apiDeck.cardGroups.map(cardGroup => {
                const { cards, invalidCards } = this.cardBlobService.parse(cardGroup.cardBlob);

                return {
                    ...cardGroup,
                    cards: cards,
                    invalidCards: invalidCards
                }
            })
        }
    }

    private mapDeckToApiDeck(deck: app.Deck): app.ApiDeck {
        return {
            ...deck,
            cardGroups: deck.cardGroups.map(cardGroup => {
                return  {
                    name: cardGroup.name,
                    cardBlob: cardGroup.cardBlob
                }
            })
        };
    }
}
