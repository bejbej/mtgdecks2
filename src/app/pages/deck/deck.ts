import * as app from "@app";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, combineLatest, merge, Observable, Subject } from "rxjs";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { contains, distinct, selectMany } from "@array";
import { DeckEvents } from "./deck.events";
import { filter, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { firstValue } from "@app";
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
    isDirty: boolean = false;
    isLoading: boolean;
    showPrices: boolean;
    isLoadingPrices: boolean = false;
    canEdit$: Observable<boolean>;
    
    // Event Management
    deckChanged$ = this.deckEvents.deckChanged$;
    isEditingGroups$ = new BehaviorSubject<boolean>(false);
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
        this.authService.authChanged$
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => this.sync());

        // When card groups change, load prices as needed
        this.deckEvents.cardGroupCardsChanged$
            .pipe(
                filter(() => this.showPrices),
                takeUntil(this.unsubscribe))
            .subscribe(cardGroups => this.loadPrices(cardGroups));

        // Stop editing card groups when the user is no longer able to edit them
        this.deckEvents.canEdit$
            .pipe(
                filter(canEdit => !canEdit),
                takeUntil(this.unsubscribe))
            .subscribe(() => this.isEditingGroups$.next(false));

        // When the user is done editing card groups, determine if the user actually changed anything
        const cardGroupsChanged$ = this.isEditingGroups$
            .pipe(
                filter(x => !x),
                withLatestFrom(this.deckEvents.cardGroupsChanged$)
            );

        // Mark the deck as dirty when it changes
        const deckChanged$ = merge(this.deckEvents.deckChanged$, cardGroupsChanged$)
            .pipe(tap(() => {
                this.updateTitle();
                this.isDirty = true;
            }));

        // Save the deck when the deck is dirty and the user is an owner of the deck
        combineLatest([deckChanged$, this.authService.authChanged$])
            .pipe(
                filter(() => this.isDirty),
                filter(() => {
                    const authUser = this.authService.getAuthUser();
                    return authUser && (!this.deck.id || contains(this.deck.owners, authUser.id));
                }))
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(() => this.save());
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
        this.isEditingGroups$.complete();
    }

    togglePrices = async () => {
        this.showPrices = !this.showPrices;

        if (this.showPrices && !this.isLoadingPrices) {
            await this.loadPrices(this.deck.cardGroups);
        }
    }

    toggleEditGroups = async () => {
        const value = await firstValue(this.isEditingGroups$);
        this.isEditingGroups$.next(!value);
    }

    delete = async () => {
        if (!confirm("Are you sure you want to delete this deck?")) {
            return;
        }

        this.isDeleting = true;
        const deleteDeck$ = this.deckService.deleteDeck(this.deck.id).pipe(takeUntil(this.unsubscribe));
        try {
            await app.firstValue(deleteDeck$);
        }
        finally {
            this.isDeleting = false;
            this.ref.markForCheck();
        }
        this.router.navigateByUrl("/decks");
    }

    save = async () => {
        const authUser = this.authService.getAuthUser();
        if (authUser === undefined) {
            return;
        }

        if (this.deck.id) {
            const updateDeck$ = this.deckService.updateDeck(this.deck).pipe(takeUntil(this.unsubscribe));
            await app.firstValue(updateDeck$);
        }
        else {
            this.deck.owners = [authUser.id];
            const createDeck$ = this.deckService.createDeck(this.deck).pipe(takeUntil(this.unsubscribe))
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
        const newDeck = !this.deck.id;
        const existingDeckAndOwner = authUser && contains(this.deck.owners, authUser.id);
        const canEdit = newDeck || existingDeckAndOwner;
        this.deckEvents.canEdit$.next(canEdit);
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
        const cardNamesWithoutUsd = selectMany(cardGroups.map(cardGroup => cardGroup.cards))
            .filter(card => card.usd === undefined)
            .map(card => card.definition.name);
            
        if (cardNamesWithoutUsd.length === 0) {
            return;
        }

        this.isLoadingPrices = true;
        const cardPrices$ = this.cardPriceService
            .getCardPrices(cardNamesWithoutUsd)
            .pipe(takeUntil(this.unsubscribe));
        const cardPrices = await firstValue(cardPrices$);
        this.deckEvents.cardPrices$.next(cardPrices);
        this.isLoadingPrices = false;
        this.ref.markForCheck();
    }
}
