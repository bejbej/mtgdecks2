import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { contains, sum } from "@array";
import { distinctUntilChanged, filter, map, startWith, takeUntil, tap } from "rxjs/operators";
import { Observable, Subject } from "rxjs";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./cardGroup.html"
})
export class CardGroupComponent implements OnInit, OnDestroy {

    @Input() deck: app.Deck;
    @Input() cardGroup: app.CardGroup;
    @Input() isInitiallyEditing: boolean;

    // Data
    columns: app.CardView[][];
    count: number;
    usd: number;
    cardGrouper = app.CardGrouper;
    private initialCardBlob: string;
    private groupFunc: app.GroupFunc;

    // State Tracking
    canEdit$ = this.deckEvents.canEdit$;
    isEditing: boolean;
    showToolbar: boolean = false;

    // Subscriptions
    private unsubscribe = new Subject<void>();

    constructor(
        private cardBlobService: app.CardBlobService,
        private deckEvents: app.DeckEvents,
        private ref: ChangeDetectorRef) { }

    ngOnInit() {
        // Update the card count when the card group changes
        this.deckEvents.deckChanged$
            .pipe(
                startWith(this.deck),
                map(() => this.cardGroup.cards),
                distinctUntilChanged(),
                map(cards => sum(cards, card => card.quantity)),
                distinctUntilChanged(),
                takeUntil(this.unsubscribe)
            )
            .subscribe(count => this.count = count);

        // Discard changes when editing is no longer allowed
        this.deckEvents.canEdit$
            .pipe(
                filter(canEdit => !canEdit),
                takeUntil(this.unsubscribe)
            )
            .subscribe(() => {
                this.discardChanges();
                this.ref.markForCheck();
            });

        // Update the price total when card prices change
        this.deckEvents.cardGroupPricesChanged$
            .pipe(
                filter(cardGroups => contains(cardGroups, this.cardGroup)),
                map(() => sum(this.cardGroup.cards, card => card.usd)),
                takeUntil(this.unsubscribe)
            )
            .subscribe(usd => this.usd = usd)

        // Redraw cards when prices change
        this.deckEvents.cardGroupPricesChanged$
            .pipe(
                map(() => {
                    return this.groupFunc === app.CardGrouper.groupByPrice ?
                        this.groupFunc(this.cardGroup.cards) :
                        this.columns.slice();
                }),
                takeUntil(this.unsubscribe)
            )
            .subscribe(columns => {
                this.columns = columns;
                this.ref.markForCheck();
            });

        if (this.isInitiallyEditing) {
            this.startEditing();
        }

        this.setGroupFunc(app.CardGrouper.groupByType);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    setGroupFunc = (func: app.GroupFunc) => {
        this.showToolbar = false;
        this.groupFunc = func;
        this.groupCards();
    }

    startEditing = () => {
        this.isEditing = true;
        this.showToolbar = false;
        this.initialCardBlob = this.cardGroup.cardBlob;
    }

    applyChanges = () => {
        if (!this.isEditing) {
            return;
        }

        this.isEditing = false;

        if (this.cardGroup.cardBlob === this.initialCardBlob) {
            return;
        }

        const { cards, invalidCards } = this.cardBlobService.parse(this.cardGroup.cardBlob);
        const newCardBlob = this.cardBlobService.stringify(cards, invalidCards);
        
        if (this.initialCardBlob === newCardBlob) {
            return;
        }
        
        this.cardGroup.cards = cards;
        this.cardGroup.invalidCards = invalidCards;
        this.cardGroup.cardBlob = newCardBlob;
        this.groupCards();
        this.deckEvents.deckChanged$.next(this.deck);
        this.deckEvents.cardGroupCardsChanged$.next([this.cardGroup]);
    }

    groupCards = () => {
        this.columns = this.groupFunc(this.cardGroup.cards);
    }

    discardChanges = () => {
        this.isEditing = false;
    }
}
