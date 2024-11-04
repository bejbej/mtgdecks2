import * as app from "@app";
import { BehaviorSubject, combineLatest, merge, Observable, of } from "rxjs";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { contains, distinct, orderBy, selectMany } from "@array";
import { map, shareReplay, switchMap, tap } from "rxjs/operators";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-decks",
    templateUrl: "./decks.html"
})
export class DecksComponent {

    decks$: Observable<app.Deck[]>;
    visibleDecks$: Observable<app.Deck[]>;
    tags$: Observable<string[]>;
    currentTag$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
    currentTagName$: Observable<string>;

    isLoading$: Observable<boolean>;

    constructor(
        private authService: app.AuthService,
        private deckService: app.DeckService) {

        document.title = "My Decks";

        const tagState = JSON.parse(localStorage.getItem(app.config.localStorage.tags)) as app.TagState;
        if (tagState) {
            this.updateCurrentTag(tagState.current);
        }
        const storedTags$ = tagState ? of(tagState.all) : of<string[]>();

        this.currentTagName$ = this.currentTag$.pipe(
            map(tag => tag === undefined ? "All" : tag === null ? "Untagged" : tag)
        );

        this.decks$ = this.authService.user$.pipe(
            switchMap(user => {
                if (user === undefined) {
                    return of([] as app.Deck[]);
                }
                
                return this.deckService.getByQuery({ owner: user.id });
            }),
            map(decks => orderBy(decks, x => x.name)),
            shareReplay()
        );

        this.visibleDecks$ = combineLatest([this.decks$, this.currentTag$]).pipe(
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

        this.isLoading$ = merge(
            this.authService.user$.pipe(map(_ => true)),
            this.decks$.pipe(map(_ => false))
        );

        const deckTags$ = this.decks$.pipe(map(decks => distinct(selectMany(decks.map(deck => deck.tags)))));

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

    updateCurrentTag(tag: string) {
        this.currentTag$.next(tag);
    }
}
