import * as app from "@app";
import { audit, filter, map, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { contains } from "@array";
import { Func } from "@types";
import { Injectable, OnDestroy } from "@angular/core";

interface State {
    canEdit: boolean;
    canSave: boolean;
    deck: app.Deck;
    isDeleted: boolean;
    isDirty: boolean;
    isNew: boolean;
}

@Injectable()
export class DeckManager implements OnDestroy {

    state$: BehaviorSubject<State> = new BehaviorSubject<State>(null);

    private user$: BehaviorSubject<app.User> = new BehaviorSubject<app.User>(undefined);
    private saveBusy$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private unsubscribe: Subject<void> = new Subject<void>();

    constructor(private deckService: app.DeckService, private authService: app.AuthService)
    {
        this.authService.user$.pipe(takeUntil(this.unsubscribe))
            .subscribe(user => this.user$.next(user));

        this.user$.pipe(
            withLatestFrom(this.state$),
            filter(([_, state]) => state !== null),
            tap(([user, state]) => {
                const canEdit = state.isNew || contains(state.deck.owners, user?.id);
                const canSave = canEdit && user !== undefined;
                this.patchState({ canEdit, canSave });
            })
        ).subscribe();

        // Persist the deck
        this.state$.pipe(
            filter(state => state && state.isDirty && state.canSave),
            audit(() => this.saveBusy$.pipe(filter(x => x === false))),
            tap(() => this.saveBusy$.next(true)),
            switchMap(state => this.persist(state)),
            tap(() => this.saveBusy$.next(false))
        ).subscribe();
    }

    loadDeck(id: string): Observable<void> {
        return this.deckService.getById(id).pipe(
            tap(deck => this.createState(deck)),
            map(() => {})
        );
    }

    createDeck(): Observable<void> {
        const tags = [];
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
            cardGroupOrder: [0],
            id: undefined,
            name: "New Deck",
            notes: "",
            owners: this.user$.value ? [this.user$.value.id] : [],
            tags: tags
        };

        this.createState(deck);
        return of(undefined);
    }

    updateDeck(func: Func<app.Deck, app.Deck>): void {
        this.updateState(prevState => {
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

    private createState(deck: app.Deck) {
        const user = this.user$.value;
        const isNew = deck.id === undefined;
        const canEdit = isNew || contains(deck.owners, user?.id);
        const canSave = canEdit && user != null;

        const state: State = {
            isNew,
            canEdit,
            canSave,
            isDirty: false,
            isDeleted: false,
            deck: deck
        };

        this.state$.next(state);
    }

    private updateState(func: Func<State, State>): void {
        const prevState = this.state$.value;
        const nextState = func(prevState);
        this.state$.next(nextState);
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
        if (state.isDeleted) {
            return this.deckService.deleteDeck(state.deck.id)
                .pipe(tap(_ => this.patchState({ isDirty: false })));
        }

        if (state.isNew) {
            return this.deckService.createDeck(state.deck).pipe(
                tap(id => {
                    const deck = {
                        ...state.deck,
                        id: id,
                        owners: [this.user$.value.id]
                    };
                    this.createState(deck);
                }),
                map(() => {})
            );
        }

        return this.deckService.updateDeck(state.deck)
            .pipe(tap(_ => this.patchState({ isDirty: false })));
    }
}