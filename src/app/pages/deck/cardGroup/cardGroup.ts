import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { distinctUntilChanged, filter, map, startWith, takeUntil } from "rxjs/operators";
import { firstValue, isDefined } from "@app";
import { Subject } from "rxjs";
import { sum } from "@array";

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
        private cardPriceService: app.CardPriceService,
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
        this.deckEvents.cardPrices$
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(cardPrices => {
                const cardsWithoutUsd = this.cardGroup.cards.filter(card => card.usd === undefined);
                if (cardsWithoutUsd.length === 0) {
                    return;
                }
                let isAnyCardUsdChanged = false;
                for (let card of cardsWithoutUsd) {
                    const cardPrice = cardPrices[card.definition.name.toLowerCase()];
                    if (cardPrice === null) {
                        card.usd = null;
                    }
                    else if (isDefined(cardPrice)) {
                        card.usd = Number(cardPrice) * card.quantity;
                        isAnyCardUsdChanged = true;
                    }
                }

                if (isAnyCardUsdChanged) {
                    this.usd = sum(this.cardGroup.cards.filter(x => isDefined(x.usd)), x => x.usd);

                    if (this.groupFunc === app.CardGrouper.groupByPrice) {
                        this.columns = this.groupFunc(this.cardGroup.cards);
                    }
                    else {
                        this.columns = this.columns.slice();
                    }

                    this.ref.markForCheck();
                }
            });

        if (this.isInitiallyEditing) {
            this.startEditing();
        }

        this.setGroupFunc(app.CardGrouper.groupByType);
        this.usd = sum(this.cardGroup.cards.filter(x => isDefined(x.usd)), x => x.usd);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    setGroupFunc = async (func: app.GroupFunc) => {
        this.showToolbar = false;
        this.groupFunc = func;
        this.groupCards();
        
        if (this.groupFunc == app.CardGrouper.groupByPrice) {
            await this.loadPrices();
        }
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

    private loadPrices = async () => {
        const cardNamesWithoutUsd = this.cardGroup.cards
            .filter(card => card.usd === undefined)
            .map(card => card.definition.name);
        if (cardNamesWithoutUsd.length > 0) {
            const cardPrices$ = this.cardPriceService
                .getCardPrices(cardNamesWithoutUsd)
                .pipe(takeUntil(this.unsubscribe));
            const cardPrices = await firstValue(cardPrices$);
            this.deckEvents.cardPrices$.next(cardPrices);
        }
    }
}
