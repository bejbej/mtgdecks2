import * as app from "@app";
import { BehaviorSubject, Subject } from "rxjs";
import { Injectable, OnDestroy } from "@angular/core";

@Injectable()
export class DeckEvents implements OnDestroy {
    canEdit$: Subject<boolean> = new BehaviorSubject<boolean>(false);
    cardGroupsChanged$: Subject<app.CardGroup[]> = new Subject<app.CardGroup[]>();
    cardGroupPricesChanged$: Subject<app.CardGroup[]> = new Subject<app.CardGroup[]>();
    cardGroupCardsChanged$: Subject<app.CardGroup[]> = new Subject<app.CardGroup[]>();
    deckChanged$: Subject<app.Deck> = new Subject<app.Deck>();

    ngOnDestroy(): void {
        Object.keys(this).forEach(key => this[key].complete());
    }
}