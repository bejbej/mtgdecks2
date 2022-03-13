import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { defaultIfEmpty, takeUntil } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { toArray, toDictionary } from "@dictionary";

interface CardGroupData {
    cardGroup: app.CardGroup,
    cards: app.Card[]
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./cardGroup.html"
})
export class CardGroupComponent implements OnInit, OnDestroy {

    @Input("data") cardGroup: app.CardGroup;
    @Input() shouldLoadPrices: Observable<void>;
    @Input() stopEdit: Observable<void>;
    @Input() canEdit: boolean;
    @Input() isInitiallyEditing: boolean;
    @Output() cardGroupChanged: EventEmitter<app.CardGroup> = new EventEmitter<app.CardGroup>();
    @Output() pricesLoading: EventEmitter<Observable<app.CardGroup>> = new EventEmitter<Observable<app.CardGroup>>();
    @Output() cardsChanged: EventEmitter<CardGroupData> = new EventEmitter<CardGroupData>();

    // Data
    cards: app.Card[];
    cardBlob: string;
    columns: app.CardView[][];
    count: number = 0;
    invalidCards: string[];
    usd: number = 0;
    cardGrouper = app.CardGrouper;
    private groupFunc: (cards: app.Card[]) => app.CardView[][];

    // State Tracking
    isEditing: boolean;
    showToolbar: boolean = false;
    private isLoadingPrices: boolean = false;

    // Subscriptions
    private unsubscribe: Subject<void> = new Subject<void>();
    private pricesLoadedSubject: Subject<app.CardGroup> = new Subject<app.CardGroup>();

    constructor(
        private cardDefinitionsService: app.CardDefinitionService,
        private cardPriceService: app.CardPriceService,
        private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.groupFunc = app.CardGrouper.groupByType;
        this.parseCardBlob(this.cardGroup.cardBlob);
        this.shouldLoadPrices.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.loadPrices());
        this.stopEdit.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.discardChanges());
        this.onCardsChanged();
        if (this.isInitiallyEditing) {
            this.startEditing();
        }
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
        this.pricesLoadedSubject.next(this.cardGroup);
        this.pricesLoadedSubject.complete();
    }

    setGroupFunc = (func: (cards: app.Card[]) => app.CardView[][]) => {
        this.showToolbar = false;
        this.groupFunc = func;
        this.onCardViewChanged();
        if (func === app.CardGrouper.groupByPrice) {
            this.loadPrices();
        }
    }

    startEditing = () => {
        this.isEditing = true;
        this.showToolbar = false;
        this.cardBlob = this.cardGroup.cardBlob;
        this.ref.markForCheck();
    }

    applyChanges = () => {
        if (!this.isEditing) {
            return;
        }

        this.isEditing = false;

        if (this.cardBlob === this.cardGroup.cardBlob) {
            return;
        }

        this.parseCardBlob(this.cardBlob);

        if (this.cardBlob === this.cardGroup.cardBlob) {
            return;
        }

        this.cardGroup.cardBlob = this.cardBlob;
        this.onCardGroupChanged();
        this.onCardsChanged();
    }

    discardChanges = () => {
        if (!this.isEditing) {
            return;
        }

        this.isEditing = false;
    }

    private parseCardBlob = (cardBlob: string) => {
        cardBlob = cardBlob.trim();

        this.cards = [];
        this.invalidCards = [];
        this.count = 0;
        this.usd = 0;

        if (cardBlob.length === 0) {
            return;
        }

        let cardDict: { [id: string]: app.Card } = {};

        cardBlob.split(/\n[\s\n]*/).forEach(line => {
            var result = /^(?:(\d+)[Xx]?\s)?\s*([^0-9]+)$/.exec(line.trim());
            if (!result) {
                this.invalidCards.push(line);
                return;
            }

            let cardDefinition = this.cardDefinitionsService.getCardDictionary()[result[2].toLowerCase()];
            if (!cardDefinition) {
                this.invalidCards.push(line);
                return;
            }

            let card = cardDict[cardDefinition.name] = cardDict[cardDefinition.name] || { definition: cardDefinition, quantity: 0, usd: undefined };

            card.quantity += Number(result[1]) || 1;
        });

        this.cards = toArray(cardDict);
        this.count = this.cards.reduce((sum, card) => sum + card.quantity, 0);
        this.cardBlob = this.invalidCards.concat(this.cards.sort((a, b) => a.definition.name > b.definition.name ? 1 : -1).map(card => {
            return card.quantity + "x " + card.definition.name;
        })).join("\n");
    }

    private loadPrices = async () => {
        if (this.isLoadingPrices) {
            return;
        }

        let cardNamesWithoutUsd = this.cards.filter(card => card.usd === undefined).map(card => card.definition.name);

        if (cardNamesWithoutUsd.length === 0) {
            return;
        }

        this.isLoadingPrices = true;
        this.pricesLoading.next(this.pricesLoadedSubject);

        try {
            let cardPrices$ = this.cardPriceService.getCardPrices(cardNamesWithoutUsd).pipe(takeUntil(this.unsubscribe), defaultIfEmpty<app.CardPrice[]>([]));
            let cardPrices = await app.firstValue(cardPrices$);
            
            if (cardPrices.length === 0) {
                return;
            }

            let cardPricesDict = toDictionary(cardPrices, card => card.name);
            this.cards.forEach(card => {
                if (card.usd === undefined) {
                    let cardPrice = cardPricesDict[card.definition.name.toLowerCase()];
                    card.usd = cardPrice ? Number(cardPrice.usd) * card.quantity : null;
                }
            });
            this.usd = this.cards.reduce((sum, card) => sum + card.usd, 0);
            this.onPricesChanged();
        }
        finally {
            this.ref.markForCheck();
            this.isLoadingPrices = false;
            this.pricesLoadedSubject.next(this.cardGroup);
        }
    }

    private onCardGroupChanged = () => {
        this.cardGroupChanged.emit(this.cardGroup);
    }

    private onCardsChanged = () => {
        this.onCardViewChanged();

        this.cardsChanged.emit({
            cardGroup: this.cardGroup,
            cards: this.cards
        });
    }

    private onPricesChanged = () => {
        if (this.groupFunc === app.CardGrouper.groupByPrice) {
            this.onCardViewChanged();
        }
        else {
            // Copy the columns so the card view change detection works properly
            this.columns = this.columns.slice();
        }
    }

    private onCardViewChanged = () => {
        this.columns = this.groupFunc(this.cards);
    }
}
