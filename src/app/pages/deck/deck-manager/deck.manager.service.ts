import { computed, inject, Injectable, OnDestroy, signal, Signal, WritableSignal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import * as app from "@app";
import { contains } from "@array";
import { Func } from "@types";
import { BehaviorSubject, noop, Observable, of, Subject } from "rxjs";
import { audit, filter, map, switchMap, takeUntil, tap } from "rxjs/operators";

export class State {
    canEdit: boolean = false;
    canSave: boolean = false;
    isDeleted: boolean = false;
    isDirty: boolean = false;
    isNew: boolean = false;

    deck: app.Deck | undefined;
    user: app.User = new app.User();
}

@Injectable()
export class DeckManagerService implements OnDestroy {

    // inject
    private authService = inject(app.AuthService);
    private deckService = inject(app.DeckService);

    // state
    state: WritableSignal<State> = signal(new State());
    deck: Signal<app.Deck>;

    // events
    private deckId$: Subject<string> = new Subject<string>();
    private saveBusy$: Subject<boolean> = new BehaviorSubject<boolean>(false);
    private unsubscribe: Subject<void> = new Subject<void>();

    constructor() {
        this.authService.user$
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(user => this.patchState({ user }));

        // Load the deck
        this.deckId$.pipe(
            switchMap(deckId => this.deckService.getById(deckId)),
            tap(deck => this.patchState({ deck })),
            takeUntil(this.unsubscribe)
        ).subscribe();

        // Persist the deck
        toObservable(this.state).pipe(
            filter(state => state.isDirty && state.canSave),
            audit(() => this.saveBusy$.pipe(filter(x => x === false))),
            tap(() => this.saveBusy$.next(true)),
            switchMap(state => this.persist(state)),
            tap(() => this.saveBusy$.next(false))
        ).subscribe();

        this.deck = computed(() => this.state().deck);
    }

    loadDeck(deckId: string): void {
        this.deckId$.next(deckId);
    }

    updateDeck(func: Func<app.Deck, app.Deck>): void {
        this.updateState(prevState => {
            if (prevState.deck === undefined) {
                return prevState;
            }

            const nextDeck = func(prevState.deck);
            return {
                ...prevState,
                deck: nextDeck,
                isDirty: true
            };
        });
    }

    patchDeck(deck: Partial<app.Deck>): void {
        this.updateDeck(prevDeck => {
            return {
                ...prevDeck,
                ...deck
            };
        });
    }

    deleteDeck(): void {
        this.patchState({ isDeleted: true, isDirty: true });
    }

    updateCardGroup(cardGroupId: number, func: Func<app.CardGroup, app.CardGroup>): void {
        this.updateDeck(prevDeck => {
            const prevCardGroup = prevDeck.cardGroups[cardGroupId];
            const nextCardGroup = func(prevCardGroup);
            return {
                ...prevDeck,
                cardGroups: {
                    ...prevDeck.cardGroups,
                    [cardGroupId]: nextCardGroup
                }
            }
        })
    }

    patchCardGroup(cardGroupId: number, cardGroup: Partial<app.CardGroup>): void {
        this.updateCardGroup(cardGroupId, prevCardGroup => {
            return {
                ...prevCardGroup,
                ...cardGroup
            };
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    private updateState(func: Func<State, State>): void {
        const nextState = func(this.state());

        const isNew = nextState.deck && nextState.deck.id === undefined;
        const canEdit = isNew || contains(nextState.deck?.owners ?? [], nextState.user.id);
        const canSave = canEdit && nextState.user.isAuthenticated;

        nextState.isNew = isNew;
        nextState.canEdit = canEdit;
        nextState.canSave = canSave;

        this.state.set(nextState);
    }

    private patchState(partialState: Partial<State>): void {
        this.updateState(prevState => {
            return {
                ...prevState,
                ...partialState
            };
        })
    }

    private persist(state: State): Observable<void> {
        if (state.deck === undefined) {
            return of(undefined);
        }

        if (state.isDeleted && state.deck.id !== undefined) {
            return this.deckService.deleteDeck(state.deck.id)
                .pipe(tap(_ => this.patchState({ isDirty: false })));
        }

        if (state.isNew && state.deck.id === undefined) {
            return this.deckService.createDeck(state.deck).pipe(
                tap(id => {
                    const deck = {
                        ...state.deck,
                        id: id,
                        owners: [state.user.id]
                    };
                    this.patchState({ deck, isDirty: false });
                }),
                map(noop)
            );
        }

        if (state.deck.id !== undefined) {
            return this.deckService.updateDeck(state.deck)
                .pipe(tap(_ => this.patchState({ isDirty: false })));
        }

        return of(undefined);
    }
}