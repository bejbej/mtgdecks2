import * as app from "@app";
import { ActivatedRoute, Router } from "@angular/router";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, Observable, Subject } from "rxjs";
import { contains, distinct, selectMany } from "@array";
import { DeckEvents } from "./deck.events";
import { filter, takeUntil, tap } from "rxjs/operators";
import { Location } from "@angular/common";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DeckEvents],
    selector: "app-deck",
    templateUrl: "./deck.html"
})
export class DeckComponent implements OnInit, OnDestroy {

    // Data
    deck: app.Deck;
    statCards: app.Card[];
    private id: string;

    // State Tracking
    isDeleting: boolean;
    isCardGroupsChanged: boolean = false;
    isDirty: boolean = false;
    isLoading: boolean;
    isEditingGroups: boolean;
    showPrices: boolean;
    isLoadingPrices: boolean = false;
    canEdit$: Observable<boolean>;

    // Event Management
    deckChanged$ = this.deckEvents.deckChanged$;
    private unsubscribe: Subject<void> = new Subject<void>();;

    constructor(
        private authService: app.AuthService,
        private cardPriceService: app.CardPriceService,
        private deckEvents: app.DeckEvents,
        private deckService: app.DeckService, 
        private location: Location,
        private ref: ChangeDetectorRef,
        private router: Router,
        route: ActivatedRoute) {

        document.title = "Loading...";
        this.canEdit$ = deckEvents.canEdit$;
        route.params.pipe(takeUntil(this.unsubscribe)).subscribe(params => this.id = params.id);

        // Update permissions whenever the auth user changes
        this.authService.getObservable().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.sync());

        // Keep track if card groups have changed while card groups are being edited
        this.deckEvents.cardGroupsChanged$.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.isCardGroupsChanged = true);

        // When card groups change, load prices as needed
        this.deckEvents.cardGroupCardsChanged$.pipe(filter(() => this.showPrices), takeUntil(this.unsubscribe)).subscribe(cardGroups => this.loadPrices(cardGroups));

        const deckChanged$ = this.deckEvents.deckChanged$.pipe(tap(() => {
            this.updateTitle();
            this.isDirty = true;
        }));
        combineLatest([deckChanged$, this.authService.getObservable()])
            .pipe(filter(() => this.isDirty), takeUntil(this.unsubscribe))
            .subscribe(async combined => {
                const [deck] = combined;
                const authUser = this.authService.getAuthUser();

                if (authUser === undefined || !deck.owners.includes(authUser.id)) {
                    return;
                }

                await this.save();
            });
    }

    async ngOnInit() {
        this.deck = await this.getDeck(this.id);
        this.updateTitle(); 
        this.sync();
        this.ref.markForCheck();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    togglePrices = async () => {
        this.showPrices = !this.showPrices;

        if (this.showPrices && !this.isLoadingPrices) {
            await this.loadPrices(this.deck.cardGroups);
        }
    }

    toggleEditGroups = () => {
        this.isEditingGroups = !this.isEditingGroups;
        if (!this.isEditingGroups && this.isCardGroupsChanged) {
            this.deckEvents.deckChanged$.next(this.deck);
            this.isCardGroupsChanged = false;
        }
    }

    delete = async () => {
        if (!confirm("Are you sure you want to delete this deck?")) {
            return;
        }

        this.isDeleting = true;
        let deleteDeck$ = this.deckService.deleteDeck(this.deck.id).pipe(takeUntil(this.unsubscribe));
        try
        {
            await app.firstValue(deleteDeck$);
        }
        finally
        {
            this.isDeleting = false;
            this.ref.markForCheck();
        }
        this.router.navigateByUrl("/decks");
    }

    save = async () => {
        this.updateTitle();
        let authUser = this.authService.getAuthUser();
        if (authUser === undefined) {
            return;
        }

        if (this.deck.id) {
            let updateDeck$ = this.deckService.updateDeck(this.deck).pipe(takeUntil(this.unsubscribe));
            await app.firstValue(updateDeck$);
        }
        else {
            let createDeck$ = this.deckService.createDeck(this.deck).pipe(takeUntil(this.unsubscribe))
            this.deck.id = await app.firstValue(createDeck$);
            this.deck.owners = this.deck.owners || [authUser.id];
            this.location.replaceState("/decks/" + this.deck.id);
        }
        this.isDirty = false;
    }

    private sync = () => {
        if (!this.deck) {
            return;
        }
        const authUser = this.authService.getAuthUser();
        if (!this.deck.id && authUser) {
            this.deck.owners = [authUser.id];
        }
        
        const newDeckAndNotLoggedIn = authUser === undefined && this.deck.id === undefined;
        const existingDeckAndOwner = authUser !== undefined && contains(this.deck.owners, authUser.id);
        const canEdit = newDeckAndNotLoggedIn || existingDeckAndOwner;
        this.deckEvents.canEdit$.next(canEdit);
        if (!canEdit) {
            this.isEditingGroups = false;
        }
    }

    private getDeck = async (id: string): Promise<app.Deck> => {
        if (id === "new") {
            return this.createDeck();
        }
        this.isLoading = true;
        try {
            const getDeck$ = this.deckService.getById(id).pipe(takeUntil(this.unsubscribe));
            return await app.firstValue(getDeck$);
        }
        finally {
            this.isLoading = false;
        }
    }

    private createDeck = () => {
        const tags = [];
        const tagState = JSON.parse(localStorage.getItem(app.config.localStorage.tags)) as app.TagState;
        if (tagState && tagState.current) {
            tags.push(tagState.current);
        }

        return {
            cardGroups: [
                {
                    cards: [],
                    invalidCards: [],
                    name: "Mainboard",
                    cardBlob: "",
                }
            ],
            id: undefined,
            name: "New Deck",
            notes: "",
            owners: [],
            tags: tags
        };
    }

    private updateTitle = () => {
        document.title = this.deck.name;
    }

    private loadPrices = async (cardGroups: app.CardGroup[]) => {
        const cardsAndGroupsWithoutUsd = selectMany(cardGroups.map(cardGroup => cardGroup.cards.map(card => ({cardGroup, card}))))

        if (cardsAndGroupsWithoutUsd.length === 0) {
            return;
        }

        this.isLoadingPrices = true;
        const cardNamesWithoutUsd = distinct(cardsAndGroupsWithoutUsd.map(group => group.card.definition.name));
        const cardPrices = await app.firstValue(this.cardPriceService.getCardPrices(cardNamesWithoutUsd).pipe(takeUntil(this.unsubscribe)));
        const cardPricesDict = toDictionary(cardPrices, card => card.name.toLowerCase());
        const changedCardGroups = new Set<app.CardGroup>();
        cardsAndGroupsWithoutUsd.forEach(group => {
            const { card, cardGroup } = group;
            const cardPrice = cardPricesDict[card.definition.name.toLowerCase()];
            if (cardPrice !== undefined) {
                card.usd = Number(cardPrice.usd) * card.quantity;
                changedCardGroups.add(cardGroup);
            }
        });
        this.isLoadingPrices = false;
        this.deckEvents.cardGroupPricesChanged$.next(Array.from(changedCardGroups));
    }
}
