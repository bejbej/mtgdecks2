import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as app from "@app";

@Injectable({
    providedIn: "root"
})
export class DeckService {

    private _url = app.config.decksUrl;

    constructor(private http: HttpClient) { }

    getById(id: string): app.Cancellable<app.Deck> {
        let observable = this.http.get<app.Deck>(this._url + "/" + id);
        return app.Cancellable.fromObservable(observable);
    }

    getByQuery(query?): app.Cancellable<any[]> {
        let observable = this.http.get<{ results: Object[] }>(this._url, { params: query })
            .pipe(map(response => response.results));
        return app.Cancellable.fromObservable(observable);
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
