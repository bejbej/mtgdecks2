import * as app from "@app";
import { BehaviorSubject, Subject } from "rxjs";
import { Dictionary } from "@types";
import { Injectable, OnDestroy } from "@angular/core";

@Injectable()
export class DeckEvents implements OnDestroy {
    canEdit$: Subject<boolean> = new BehaviorSubject<boolean>(false);
    cardGroupsChanged$: Subject<app.CardGroup[]> = new Subject<app.CardGroup[]>();
    cardGroupCardsChanged$: Subject<app.CardGroup[]> = new Subject<app.CardGroup[]>();
    deckChanged$: Subject<app.Deck> = new Subject<app.Deck>();
    cardPrices$: Subject<Dictionary<string>> = new Subject<Dictionary<string>>();

    ngOnDestroy(): void {
        for (let key of Object.keys(this)) {
            this[key].complete();
        }
    }
}