import * as app from "@app";
import { ActivatedRoute, Router } from "@angular/router";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { first, takeUntil } from "rxjs/operators";
import { Location } from "@angular/common";
import { Observable, Subject } from "rxjs";

interface CardGroupData {
    cardGroup: app.CardGroup,
    cards: app.Card[]
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck",
    templateUrl: "./deck.html"
})
export class DeckComponent implements OnInit, OnDestroy {

    // Data
    deck: app.Deck;
    tags: string;
    statCards: app.Card[];
    private id: string;

    // State Tracking
    canWrite: boolean;
    isDeleting: boolean;
    isDirty: boolean;
    isLoading: boolean;
    isSaving: boolean;
    isEditingGroups: boolean;
    numberOfLoaders: number = 0;
    showPrices: boolean;
    cardGroupsChanged: boolean = false;

    // Event Management
    loadPrices: Subject<void> = new Subject<void>();
    updateStats: Subject<app.Card[]> = new Subject<app.Card[]>();
    stopEdit: Subject<void> = new Subject<void>();
    private unsubscribe: Subject<void> = new Subject<void>();;

    constructor(
        private authService: app.AuthService,
        private deckService: app.DeckService, 
        private location: Location,
        private ref: ChangeDetectorRef,
        private router: Router,
        route: ActivatedRoute) {

        document.title = "Loading...";
        route.params.subscribe(params => this.id = params.id);
        this.authService.getObservable().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.sync());
    }

    async ngOnInit() {
        await this.loadDeck(this.id);
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    togglePrices = () => {
        this.showPrices = !this.showPrices;
        if (this.showPrices) {
            this.loadPrices.next();
        }
    }

    toggleEditGroups = () => {
        this.isEditingGroups = !this.isEditingGroups;
        if (!this.isEditingGroups && this.cardGroupsChanged && this.deck.id) {
            this.save();
            this.cardGroupsChanged = false;
        }
    }

    pricesLoading = (observable: Observable<app.CardGroup>) => {
        ++this.numberOfLoaders;
        observable.pipe(takeUntil(this.unsubscribe), first()).subscribe(() => {
            --this.numberOfLoaders
            if (this.numberOfLoaders === 0) {
                this.ref.detectChanges();
            }
        });
    }

    cardsChanged = (event: CardGroupData) => {
        if (this.showPrices) {
            this.loadPrices.next();
        }

        if (this.deck.cardGroups.indexOf(event.cardGroup) === 0) {
            this.updateStats.next(event.cards);
        }
    }

    tagsChanged = () => {
        if (this.tags.length === 0) {
            this.deck.tags = [];
        }
        else {
            this.deck.tags = this.tags.split(/\s*,\s*/).map(x => x.toLowerCase());
        }
        this.save();
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
        this.isDirty = true;
        let authUser = this.authService.getAuthUser();
        if (authUser === undefined) {
            return;
        }

        this.isSaving = true;
        try
        {
            if (this.deck.id) {
                let updateDeck$ = this.deckService.updateDeck(this.deck).pipe(takeUntil(this.unsubscribe));
                await app.firstValue(updateDeck$);
            }
            else {
                let createDeck$ = this.deckService.createDeck(this.deck).pipe(takeUntil(this.unsubscribe))
                this.deck.id = await app.firstValue(createDeck$);
                this.deck.owners = this.deck.owners || [authUser.id];
                this.location.replaceState("/decks/" + this.deck.id);
                this.ref.markForCheck();
            }
        }
        finally
        {
            this.isDirty = false;
            this.isSaving = false;
        }
    }

    private sync = () => {
        if (!this.deck) {
            return;
        }
        var authUser = this.authService.getAuthUser();
        if (!this.deck.id && authUser) {
            this.deck.owners = [authUser.id];
        }
        this.canWrite = (!authUser && !this.deck.id) || (authUser && this.deck.owners.indexOf(authUser.id) > -1);
        if (!this.canWrite) {
            this.isEditingGroups = false;
            this.stopEdit.next();
        }
        if (authUser && this.isDirty) {
            this.save();
        }
    }

    private loadDeck = async (id: string) => {
        if (id === "new") {
            this.deck = this.createDeck();
            this.tags = this.deck.tags.join(", ");
            this.sync();
            this.updateTitle();
            return;
        }
        this.isLoading = true;
        try {
            let getDeck$ = this.deckService.getById(id).pipe(takeUntil(this.unsubscribe))
            this.deck = await app.firstValue(getDeck$);
            this.tags = this.deck.tags.join(", ");
            this.sync();
            this.updateTitle();
        }
        finally {
            this.isLoading = false;
            this.ref.markForCheck();
        }
    }

    private createDeck = () => {
        let tags = [];
        let tagState = JSON.parse(localStorage.getItem(app.config.localStorage.tags)) as app.TagState;
        if (tagState && tagState.current) {
            tags.push(tagState.current);
        }

        return {
            cardGroups: [
                {
                    cardBlob: "",
                    name: "Mainboard"
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
}
