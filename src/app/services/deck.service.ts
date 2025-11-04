import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { config } from "@config";
import { ApiDeck, CardGroup, Deck, QueriedDeck } from "@entities";
import { noop, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { CardBlobService } from "./card-blob.service";

@Injectable({
    providedIn: "root"
})
export class DeckService {

    private cardBlobService = inject(CardBlobService);
    private http = inject(HttpClient);

    private _url = config.decksUrl;

    getById(id: string): Observable<Deck> {
        return this.http.get<ApiDeck>(this._url + "/" + id)
            .pipe(map(apiDeck => this.mapToDto(apiDeck)));
    }

    getByQuery(query?): Observable<QueriedDeck[]> {
        return this.http.get<{ results: QueriedDeck[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
    }

    createDeck(deck: Deck): Observable<string> {
        const url = this._url + "/" + deck.id;
        const apiDeck = this.mapFromDto(deck);
        return this.http.post<{ id: string }>(url, apiDeck)
            .pipe(map(response => response.id));
    }

    updateDeck(deck: Deck): Observable<void> {
        const url = this._url + "/" + deck.id;
        const apiDeck = this.mapFromDto(deck);
        return this.http.put(url, apiDeck).pipe(map(noop));
    }

    deleteDeck(id: string): Observable<void> {
        let url = this._url + "/" + id;
        return this.http.delete(url).pipe(map(noop));
    }

    private mapToDto(apiDeck: ApiDeck): Deck {
        const cardGroups = apiDeck.cardGroups.map(cardGroup => {
            const { cards, invalidCards } = this.cardBlobService.parse(cardGroup.cardBlob);
            return {
                cards: cards,
                invalidCards: invalidCards,
                name: cardGroup.name
            } as CardGroup;
        });

        return {
            cardGroups: cardGroups,
            id: apiDeck.id,
            name: apiDeck.name,
            notes: apiDeck.notes,
            owners: apiDeck.owners,
            tags: apiDeck.tags
        } as Deck;
    }

    private mapFromDto(deckDto: Deck) {
        const cardGroups = deckDto.cardGroups.map(cardGroup => {
            const cardBlob = this.cardBlobService.stringify(cardGroup.cards, cardGroup.invalidCards);

            return {
                cardBlob: cardBlob,
                name: cardGroup.name
            }
        });

        return {
            cardGroups: cardGroups,
            id: deckDto.id,
            name: deckDto.name,
            notes: deckDto.notes,
            owners: deckDto.owners,
            tags: deckDto.tags
        } as ApiDeck;
    }
}
