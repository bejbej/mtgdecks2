import * as app from "@app";
import { audit, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { BehaviorSubject, noop, Observable, of, Subject } from "rxjs";
import { contains } from "@array";
import { Func } from "@types";
import { Injectable, OnDestroy } from "@angular/core";

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

    state$: Subject<State> = new BehaviorSubject<State>(new State());
    deck$: Observable<app.Deck>;

    private saveBusy$: Subject<boolean> = new BehaviorSubject<boolean>(false);
    private unsubscribe: Subject<void> = new Subject<void>();

    private state: State = new State();

    constructor(private deckService: app.DeckService, private authService: app.AuthService)
    {
        this.authService.user$.pipe(takeUntil(this.unsubscribe))
            .subscribe(user => this.patchState({ user }));

        // Persist the deck
        this.state$.pipe(
            filter(state => state.isDirty && state.canSave),
            audit(() => this.saveBusy$.pipe(filter(x => x === false))),
            tap(() => this.saveBusy$.next(true)),
            switchMap(state => this.persist(state)),
            tap(() => this.saveBusy$.next(false))
        ).subscribe();

        this.deck$ = this.state$.pipe(
            map(state => state.deck),
            filter(deck => deck !== undefined),
            distinctUntilChanged()
        );
    }

    loadDeck(id: string): Observable<void> {
        return this.deckService.getById(id).pipe(
            tap(deck => this.patchState({ deck })),
            map(noop)
        );
    }

    createDeck(): Observable<void> {
        const tags = [] as string[];
        const tagState = JSON.parse(localStorage.getItem(app.config.localStorage.tags)) as app.TagState;
        if (tagState && tagState.current) {
            tags.push(tagState.current);
        }

        const deck: app.Deck = {
            cardGroups: {
                0 : {
                    cards: [],
                    invalidCards: [],
                    name: "Mainboard",
                }
            },
            id: undefined,
            cardGroupOrder: [0],
            name: "New Deck",
            notes: "",
            owners: [],
            tags: tags
        };

        this.patchState({ deck });
        return of(undefined);
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

    patchCardGroup(cardGroupId, cardGroup: Partial<app.CardGroup>): void {
        this.updateCardGroup(cardGroupId, prevCardGroup => {
            return {
                ...prevCardGroup,
                ...cardGroup
            };
        });
    }

    ngOnDestroy(): void {
        this.state$.complete();
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    private updateState(func: Func<State, State>): void {
        const nextState = func(this.state);

        const isNew = nextState.deck && nextState.deck.id === undefined;
        const canEdit = isNew || contains(nextState.deck?.owners ?? [], nextState.user.id);
        const canSave = canEdit && nextState.user.isAuthenticated;

        nextState.isNew = isNew;
        nextState.canEdit = canEdit;
        nextState.canSave = canSave;

        this.state = nextState;

        this.state$.next(this.state);
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