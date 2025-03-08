import * as app from "@app";
import { BehaviorSubject, combineLatest, merge, Observable, of } from "rxjs";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { contains, distinct, orderBy, selectMany } from "@array";
import { filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-decks",
    templateUrl: "./decks.component.html"
})
export class DecksComponent {

    visibleDecks$: Observable<app.QueriedDeck[]>;
    tags$: Observable<string[]>;
    currentTag$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
    currentTagName$: Observable<string>;

    isLoading$: Observable<boolean>;

    constructor(
        private authService: app.AuthService,
        private deckService: app.DeckService) {

        document.title = "My Decks";

        const tagState = JSON.parse(localStorage.getItem(app.config.localStorage.tags) ?? null) as app.TagState;
        if (tagState) {
            this.updateCurrentTag(tagState.current);
        }
        const storedTags$ = tagState ? of(tagState.all) : of<string[]>();

        this.currentTagName$ = this.currentTag$.pipe(
            map(tag => tag === undefined ? "All" : tag === null ? "Untagged" : tag)
        );

        const state$ = this.authService.user$.pipe(
            switchMap(user => {
                if (!user.isAuthenticated) {
                    return of({ isLoading: false, decks: [] as app.QueriedDeck[] });
                }
                
                return this.deckService.getByQuery({ owner: user.id }).pipe(
                    map(decks => ({ isLoading: false, decks: orderBy(decks, x => x.name) })),
                    startWith({ isLoading: true, decks: [] as app.QueriedDeck[] })
                );
            }),
            shareReplay()
        );

        this.isLoading$ = state$.pipe(map(x => x.isLoading));
        const decks$ = state$.pipe(map(x => x.decks));

        this.visibleDecks$ = combineLatest([decks$, this.currentTag$]).pipe(
            map(([decks, currentTag]) => {
                switch (currentTag) {
                    case undefined:
                        return decks;
                    case null:
                        return decks.filter(deck => deck.tags.length === 0);
                    default:
                        return decks.filter(deck => contains(deck.tags, currentTag));
                }
            })
        );

        const deckTags$ = state$.pipe(
            filter(state => state.isLoading === false),
            map(state => distinct(selectMany(state.decks.map(deck => deck.tags))))
        );

        this.tags$ = merge(storedTags$, deckTags$).pipe(map(tags => orderBy(tags, x => x)));

        combineLatest([this.tags$, this.currentTag$]).pipe(
            tap(([tags, currentTag]) => {
                const tagState: app.TagState = {
                    all: tags,
                    current: currentTag
                };

                localStorage.setItem(app.config.localStorage.tags, JSON.stringify(tagState));
            })
        ).subscribe();
    }

    updateCurrentTag(tag: string | null | undefined) {
        this.currentTag$.next(tag);
    }
}
