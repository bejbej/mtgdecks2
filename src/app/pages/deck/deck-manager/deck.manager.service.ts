import { computed, DestroyRef, inject, Injectable, signal, Signal, WritableSignal } from "@angular/core";
import { takeUntilDestroyed, toObservable, toSignal } from "@angular/core/rxjs-interop";
import { config } from "@config";
import { TagState } from "@entities";
import { Action, hasNoLength, isDefined } from "@utilities";
import { BehaviorSubject, combineLatest, noop, Observable, of, Subject } from "rxjs";
import { delay, delayWhen, filter, first, map, pairwise, shareReplay, switchMap, tap } from "rxjs/operators";
import { toggle } from "src/app/common/observable";
import { AuthService, User } from "src/app/services/auth.service";
import { DeckService } from "src/app/services/deck.service";
import { LocalStorageService } from "src/app/services/local-storage.service";
import { MutableDeck } from "./mutable-deck";

interface ActionContext {
    id: number;
    delayUntil$: Observable<void>;
    performAction: Action<Observable<void>>;
}

@Injectable()
export class DeckManagerService {

    // inject
    private authService = inject(AuthService);
    private deckService = inject(DeckService);
    private destroyRef = inject(DestroyRef);
    private localStorageService = inject(LocalStorageService);

    public deck: Signal<MutableDeck>;
    public canEdit: Signal<boolean>;
    public canSave: Signal<boolean>;
    public isLoading: Signal<boolean>;
    public isNew: Signal<boolean>;
    public isDeleting: WritableSignal<boolean> = signal(false);
    public isDeleted: WritableSignal<boolean> = signal(false);

    private deckId$: Subject<string> = new Subject<string>();
    private user: Signal<User> = this.authService.user;
    private user$: Observable<User> = this.authService.user$;
    private isSaving$: Subject<boolean> = new BehaviorSubject<boolean>(false);
    private actions$: Subject<ActionContext> = new Subject<ActionContext>();

    constructor() {
        const deck$ = this.deckId$.pipe(
            switchMap(deckId => this.loadDeck(deckId)),
            shareReplay({ refCount: true })
        );
        this.deck = toSignal(deck$, { initialValue: new MutableDeck() });
        this.isLoading = toSignal(toggle(this.deckId$, deck$.pipe(delay(0))), { initialValue: false });

        this.isNew = computed(() => hasNoLength(this.deck().id));

        this.canEdit = computed(() => {
            const isNew = this.isNew();
            const deck = this.deck();
            const user = this.user();
            return isNew || deck.owners().includes(user.id);
        });

        this.canSave = computed(() => {
            const user = this.user();
            const canEdit = this.canEdit();
            return user.isAuthenticated && canEdit;
        });

        const state = computed(() => {
            this.deck().name();
            this.deck().notes();
            this.deck().tags();
            for (let cardGroup of this.deck().cardGroups()) {
                cardGroup.cards();
                cardGroup.invalidCards();
                cardGroup.name();
            }

            return {
                deck: this.deck()
            };
        });

        toObservable(state).pipe(
            // States where the previous and next state are for the same deck
            // Should choose only state where a deck was modified after the inital loading
            pairwise(),
            filter(([prev, next]) => prev.deck === next.deck),
            map(([prev, next]) => next.deck),
            // Push an update deck action to the queue
            map(deck => {
                return {
                    delayUntil$: this.delayUntilAbleToPerformAction(deck),
                    performAction: () => this.saveDeck(deck)
                } as ActionContext;
            }),
            tap(action => this.actions$.next(action)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();

        this.actions$.pipe(
            filter(() => !this.isDeleting()),
            // Discard previous actions when a new one is pushed
            switchMap(context => {
                return of(context).pipe(
                    delayWhen(context => context.delayUntil$),
                );
            }),
            tap(_ => this.isSaving$.next(true)),
            switchMap(context => context.performAction()),
            tap(_ => this.isSaving$.next(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    public setDeckId(id: string): void {
        this.deckId$.next(id);
    }

    public setDeleted(): void {
        const deck = this.deck();

        if (this.isNew()) {
            return;
        }

        const action = {
            delayUntil$: this.delayUntilAbleToPerformAction(deck),
            performAction: () => this.deckService.deleteDeck(deck.id()).pipe(
                tap(() => this.isDeleted.set(true))
            )
        } as ActionContext;

        this.actions$.next(action);
        this.isDeleting.set(true);
    }

    private loadDeck(id: string): Observable<MutableDeck> {
        if (id === "new") {
            const tagState = this.localStorageService.getObject<TagState>(config.localStorage.tags);
            const tags = isDefined(tagState?.current) ? [tagState.current] : [];
            const deck = new MutableDeck();
            deck.name.set("New Deck");
            deck.cardGroups.set([{
                name: signal("Mainboard"),
                cards: signal([]),
                invalidCards: signal([])
            }]);
            deck.tags.set(tags);
            return of(deck);
        }
        else {
            return this.deckService.getById(id).pipe(
                map(deck => new MutableDeck(deck))
            );
        }
    }

    private saveDeck(deck: MutableDeck): Observable<void> {
        if (this.isNew()) {
            const user = this.user();
            return this.deckService.createDeck(deck.toDeck()).pipe(
                tap(id => {
                    deck.id.set(id);
                    deck.owners.set([user.id]);
                }),
                map(noop)
            );
        }
        else {
            return this.deckService.updateDeck(deck.toDeck());
        }
    }

    private delayUntilAbleToPerformAction(deck: MutableDeck): Observable<void> {
        return combineLatest([this.user$, this.isSaving$]).pipe(
            filter(([user, isSaving]) => {
                return !isSaving &&
                    user.isAuthenticated &&
                    (this.isNew() || deck.owners().includes(user.id))
            }),
            first(),
            map(noop)
        )
    }
}