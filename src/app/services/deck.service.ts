import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { config } from "@config";
import { ApiDeck, Deck, QueriedDeck, TagState } from "@entities";
import { noop, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { CardBlobService } from "./card-blob.service";
import { LocalStorageService } from "./local-storage.service";

@Injectable({
    providedIn: "root"
})
export class DeckService {

    private localStorageService = inject(LocalStorageService);
    private cardBlobService = inject(CardBlobService);
    private http = inject(HttpClient);

    private _url = config.decksUrl;

    getById(id: string): Observable<Deck> {
        if (id === "new") {
            return of(this.createDefaultDeck());
        }

        return this.http.get<ApiDeck>(this._url + "/" + id)
            .pipe(map(x => this.mapApiDeckToDeck(x)));
    }

    getByQuery(query?): Observable<QueriedDeck[]> {
        return this.http.get<{ results: QueriedDeck[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
    }

    createDeck(deck: Deck): Observable<string> {
        return this.http.post<{ id: string }>(this._url, this.mapDeckToApiDeck(deck))
            .pipe(map(response => response.id));
    }

    updateDeck(deck: Deck): Observable<void> {
        let url = this._url + "/" + deck.id;
        return this.http.put(url, this.mapDeckToApiDeck(deck)).pipe(map(noop));
    }

    deleteDeck(id: string): Observable<void> {
        let url = this._url + "/" + id;
        return this.http.delete(url).pipe(map(noop));
    }

    private mapApiDeckToDeck(apiDeck: ApiDeck): Deck {
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

    private mapDeckToApiDeck(deck: Deck): ApiDeck {
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

    private createDefaultDeck(): Deck {
        const tags = [] as string[];
        const tagState = this.localStorageService.getObject<TagState>(config.localStorage.tags);
        if (tagState && tagState.current) {
            tags.push(tagState.current);
        }

        return {
            cardGroups: {
                0: {
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
