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

    constructor(private http: HttpClient) { }

    getById(id: string): Observable<app.Deck> {
        return this.http.get<app.Deck>(this._url + "/" + id);
    }

    getByQuery(query?): Observable<any[]> {
        return this.http.get<{ results: Object[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
    }

    createDeck(deck): Observable<string> {
        return this.http.post<{ id: string }>(this._url, deck)
            .pipe(map(response => response.id));
    }

    updateDeck(deck: app.Deck): Observable<any> {
        let url = this._url + "/" + deck.id;
        return this.http.put(url, deck);
    }

    deleteDeck(id: string): Observable<any> {
        let url = this._url + "/" + id;
        return this.http.delete(url);
    }
}
