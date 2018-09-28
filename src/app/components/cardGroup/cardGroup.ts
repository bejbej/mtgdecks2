import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { Observable, Subscription } from "rxjs";
import * as app from "@app";

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
    @Input() canEdit: boolean;
    @Input() isInitiallyEditing: boolean;
    @Output() cardGroupChanged: EventEmitter<app.CardGroup> = new EventEmitter<app.CardGroup>();
    @Output() pricesLoaded: EventEmitter<app.CardGroup> = new EventEmitter<app.CardGroup>();
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
    private isLoadingPrices: boolean;

    // Subscriptions
    private pricesSubscription: app.Cancellable<app.CardPrice[]>;
    private shouldLoadPricesSubscription: Subscription;

    constructor(
        private cardDefinitionsService: app.CardDefinitionService,
        private cardPriceService: app.CardPriceService,
        private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.groupFunc = app.CardGrouper.groupByType;
        this.parseCardBlob(this.cardGroup.cardBlob);
        this.shouldLoadPricesSubscription = this.shouldLoadPrices.subscribe(() => this.loadPrices());
        this.onCardsChanged();
        if (this.isInitiallyEditing) {
            this.startEditing();
        }
    }

    ngOnDestroy() {
        this.shouldLoadPricesSubscription.unsubscribe();
        if (this.pricesSubscription) {
            this.pricesSubscription.cancel();
        }
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

            let cardDefinition = this.cardDefinitionsService.getCards()[result[2].toLowerCase()];
            if (!cardDefinition) {
                this.invalidCards.push(line);
                return;
            }

            let card = cardDict[cardDefinition.name] = cardDict[cardDefinition.name] || { definition: cardDefinition, quantity: 0, usd: undefined };

            card.quantity += Number(result[1]) || 1;
        });

        this.cards = app.Dictionary.toArray(cardDict);
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
            this.onPricesLoaded();
            return;
        }

        this.isLoadingPrices = true;
        this.pricesSubscription = this.cardPriceService.getCardPrices(cardNamesWithoutUsd);
        try {
            let cardPrices = await this.pricesSubscription.promise;
            let cardPricesDict = app.Dictionary.fromArray(cardPrices, card => card.name);
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
            this.isLoadingPrices = false;
            delete this.pricesSubscription;
            this.onPricesLoaded();
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

    private onPricesLoaded = () => {
        this.pricesLoaded.emit(this.cardGroup);
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
