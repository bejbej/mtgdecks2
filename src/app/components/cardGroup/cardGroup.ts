import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { combineLatest, merge, Observable, Subject } from "rxjs";
import { defaultIfEmpty, filter, map, startWith } from "rxjs/operators";
import { sum } from "@array";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./cardGroup.html"
})
export class CardGroupComponent implements OnInit, OnDestroy {

    @Input() cardGroup: app.CardGroup;
    @Input() isInitiallyEditing: boolean;
    @Input() showPrices$: Observable<boolean>;
    @Input() canEdit$: Observable<boolean>;

    @Output() cardGroupChanged: EventEmitter<app.CardGroup> = new EventEmitter<app.CardGroup>();
    @Output() pricesLoading: EventEmitter<Observable<app.CardGroup>> = new EventEmitter<Observable<app.CardGroup>>();

    // Data
    cardBlob: string;
    columns: app.CardView[][];
    count: number;
    usd: number;
    cardGrouper = app.CardGrouper;
    private initialCardBlob: string;
    private groupFunc$: Subject<app.GroupFunc> = new Subject<app.GroupFunc>();
    private groupFunc: app.GroupFunc;

    // State Tracking
    isEditing: boolean;
    showToolbar: boolean = false;
    private isLoadingPrices: boolean = false;

    // Subscriptions
    private sub = new app.SubscriptionManager();
    private pricesLoaded$: Subject<app.CardGroup> = new Subject<app.CardGroup>();

    constructor(
        private cardBlobService: app.CardBlobService,
        private cardPriceService: app.CardPriceService,
        private ref: ChangeDetectorRef) { }

    ngOnInit() {
        // Discard changes when editing is no longer allowed
        this.sub.observe(this.canEdit$).subscribe(canEdit => {
            if (!canEdit) {
                this.discardChanges();
            }
        });

        const cardGroup$ = this.cardGroupChanged.pipe(startWith(this.cardGroup));

        // Update the card count when the card group changes
        this.sub.observe(cardGroup$).subscribe(cardGroup =>
            this.count = sum(cardGroup.cards, card => card.quantity));

        // Update the price total when card prices changes
        this.sub.observe(this.pricesLoaded$).subscribe(cardGroup =>
            this.usd = sum(cardGroup.cards, card => card.usd));

        // Start loading prices 
        const showPrices$ = combineLatest([this.showPrices$, cardGroup$]).pipe(filter(x => x[0]));
        this.sub.observe(showPrices$).subscribe(() => this.loadPrices());

        // Temporarily clear the price total while prices are loading
        this.sub.observe(this.pricesLoading).subscribe(() => delete this.usd);

        // Redraw cards when prices changes
        const reflow1$ = this.pricesLoaded$.pipe(map(cardGroup => {
            return this.groupFunc === app.CardGrouper.groupByPrice ?
                this.groupFunc(cardGroup.cards) :
                this.columns.slice();
        }));

        // Redraw cards when card of the grouping changes
        const reflow2$ = combineLatest([cardGroup$, this.groupFunc$]).pipe(map(combined => {
            const [ cardGroup, groupFunc ] = combined;
            return groupFunc(cardGroup.cards);
        }));

        // Update columns when cards are redrawn
        this.sub.observe(merge(reflow1$, reflow2$)).subscribe(columns => this.columns = columns);

        // Load prices when the group func is group by price
        this.sub.observe(this.groupFunc$).subscribe(groupFunc => {
            this.groupFunc = groupFunc;
            if (groupFunc === app.CardGrouper.groupByPrice) {
                this.loadPrices();
            }
        });

        if (this.isInitiallyEditing) {
            this.startEditing();
        }

        this.groupFunc$.next(app.CardGrouper.groupByType);
    }

    ngOnDestroy() {
        this.sub.unsubscribeAll();
        this.pricesLoaded$.next(this.cardGroup);
        this.pricesLoaded$.complete();
    }

    setGroupFunc = (func: app.GroupFunc) => {
        this.showToolbar = false;
        this.groupFunc$.next(func);
    }

    startEditing = () => {
        this.isEditing = true;
        this.showToolbar = false;
        this.cardBlob = this.cardBlobService.stringify(this.cardGroup.cards, this.cardGroup.invalidCards);
        this.initialCardBlob = this.cardBlob;
    }

    applyChanges = () => {
        if (!this.isEditing) {
            return;
        }

        this.isEditing = false;

        if (this.cardBlob === this.initialCardBlob) {
            return;
        }

        const { cards, invalidCards } = this.cardBlobService.parse(this.cardBlob);
        const newCardBlob = this.cardBlobService.stringify(cards, invalidCards);
        
        if (this.initialCardBlob === newCardBlob) {
            return;
        }
        
        this.cardGroup.cards = cards;
        this.cardGroup.invalidCards = invalidCards;
        this.cardGroupChanged.emit(this.cardGroup);
    }

    discardChanges = () => {
        this.isEditing = false;
    }

    private loadPrices = async () => {
        if (this.isLoadingPrices) {
            return;
        }

        const cardNamesWithoutUsd = this.cardGroup.cards.filter(card => card.usd === undefined).map(card => card.definition.name);

        if (cardNamesWithoutUsd.length === 0) {
            return;
        }

        this.isLoadingPrices = true;
        this.pricesLoading.next(this.pricesLoaded$);

        try {
            const cardPrices$ = this.sub.observe(this.cardPriceService.getCardPrices(cardNamesWithoutUsd).pipe(defaultIfEmpty<app.CardPrice[]>([])));
            const cardPrices = await app.firstValue(cardPrices$);
            
            if (cardPrices.length === 0) {
                return;
            }

            const cardPricesDict = toDictionary(cardPrices, card => card.name);
            this.cardGroup.cards.forEach(card => {
                if (card.usd === undefined) {
                    const cardPrice = cardPricesDict[card.definition.name.toLowerCase()];
                    card.usd = cardPrice ? Number(cardPrice.usd) * card.quantity : null;
                }
            });
        }
        finally {
            this.ref.markForCheck();
            this.isLoadingPrices = false;
            this.pricesLoaded$.next(this.cardGroup);
        }
    }
}
