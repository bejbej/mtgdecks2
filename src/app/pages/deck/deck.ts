import * as app from "@app";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { ChangeDetectionStrategy, Component, OnDestroy } from "@angular/core";
import { DeckManager } from "./deck.manager";
import { distinctUntilChanged, filter, map, startWith, switchMap, takeUntil, tap } from "rxjs/operators";
import { Location } from "@angular/common";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DeckManager],
    selector: "app-deck",
    templateUrl: "./deck.html"
})
export class DeckComponent implements OnDestroy {

    canEdit$: Observable<boolean>;
    deck$: Observable<app.Deck>;
    isDeleting$: Observable<boolean>;
    isEditingGroups$: Observable<boolean>;
    isLoading$: Observable<boolean>;
    showPrices$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private shouldEditGroups$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private unsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private deckManager: app.DeckManager,
        location: Location,
        router: Router,
        route: ActivatedRoute) {

        this.canEdit$ = deckManager.state$.pipe(
            map(state => state.canEdit),
            distinctUntilChanged()
        );

        this.deck$ = deckManager.deck$;
        
        this.isLoading$ = deckManager.state$.pipe(
            map(state => state.deck === undefined),
            distinctUntilChanged()
        );
        
        this.isDeleting$ = deckManager.state$.pipe(
            map(state => state.isDeleted && state.isDirty),
            distinctUntilChanged()
        );

        this.isEditingGroups$ = combineLatest([this.canEdit$, this.shouldEditGroups$]).pipe(
            map(([canEdit, shouldEditGroups]) => canEdit && shouldEditGroups),
            distinctUntilChanged()
        );

        // Load a new deck each time route params change
        route.params.pipe(
            map(params => params.id),
            distinctUntilChanged(),
            switchMap(id => id === "new" ? this.deckManager.createDeck() : this.deckManager.loadDeck(id)),
            takeUntil(this.unsubscribe)
        ).subscribe();

        // Update the page name whenever the deck's name changes
        this.deck$.pipe(
            map(deck => deck.name),
            distinctUntilChanged(),
            startWith("Loading..."),
            takeUntil(this.unsubscribe),
            tap(name => document.title = name)
        ).subscribe();

        // Update the page url when the deck's id changes
        this.deck$.pipe(
            map(deck => deck.id ?? "new"),
            distinctUntilChanged(),
            takeUntil(this.unsubscribe),
            tap(id => location.replaceState("/decks/" + id))
        ).subscribe();

        // Navigate to the dacks page when the deck is deleted and persisted
        deckManager.state$.pipe(
            tap(state => {
                if (state.isDeleted && !state.isDirty) {
                    router.navigateByUrl("/decks");
                }
            }),
            takeUntil(this.unsubscribe)
        ).subscribe();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    togglePrices() {
        this.showPrices$.next(!this.showPrices$.value);
    }

    toggleEditGroups() {
        this.shouldEditGroups$.next(!this.shouldEditGroups$.value);
    }

    updateName = (name: string): void => {
        this.deckManager.patchDeck({ name });
    }

    delete = async () => {
        if (confirm("Are you sure you want to delete this deck?")) {
            this.deckManager.deleteDeck();
        }
    }
}
