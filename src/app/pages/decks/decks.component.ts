import * as app from "@app";
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, Signal, WritableSignal } from "@angular/core";
import { contains, distinct, orderBy, selectMany } from "@array";
import { map, startWith, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-decks",
    templateUrl: "./decks.component.html",
    standalone: false
})
export class DecksComponent {

    private authService = inject(app.AuthService);
    private deckService = inject(app.DeckService);
    private localStorageService = inject(app.LocalStorageService);

    visibleDecks: Signal<app.QueriedDeck[]>;
    tags: Signal<string[]>;
    currentTag: WritableSignal<string> = signal(null);
    currentTagName: Signal<string>;
    isLoading: Signal<boolean>;

    constructor() {

        document.title = "My Decks";

        const tagState = this.localStorageService.getObject<app.TagState>(app.config.localStorage.tags);
        if (tagState) {
            this.updateCurrentTag(tagState.current);
        }
        const storedTags = tagState?.all ?? [];

        this.currentTagName = computed(() => {
            const currentTag = this.currentTag();
            return currentTag === undefined ? "All" : currentTag === null ? "Untagged" : currentTag
        })

        const state$ = this.authService.user$.pipe(
            switchMap(user => {
                if (!user.isAuthenticated) {
                    return of({ isLoading: false, decks: [] as app.QueriedDeck[] });
                }
                
                return this.deckService.getByQuery({ owner: user.id }).pipe(
                    map(decks => ({ isLoading: false, decks: orderBy(decks, x => x.name) })),
                    startWith({ isLoading: true, decks: [] as app.QueriedDeck[] })
                );
            })
        );

        const state = toSignal(state$);
        this.isLoading = computed(() => state().isLoading);
        this.visibleDecks = computed(() => this.filterDecks(state().decks, this.currentTag()));
        const deckTags = computed(() => {
            const decks = state().decks;
            const tags = distinct(selectMany(decks.map(deck => deck.tags)));
            return orderBy(tags, x => x);
        });
        this.tags = computed(() => state().isLoading ? storedTags : deckTags());

        effect(() => this.persistTagState(this.tags(), this.currentTag()));
    }

    updateCurrentTag(tag: string | null | undefined) {
        this.currentTag.set(tag);
    }

    private filterDecks(decks: app.QueriedDeck[], tag: string): app.QueriedDeck[] {
        switch (tag) {
            case undefined:
                return decks;
            case null:
                return decks.filter(deck => deck.tags.length === 0);
            default:
                return decks.filter(deck => contains(deck.tags, tag));
        }
    }

    private persistTagState(tags: string[], currentTag: string): void {
        const tagState: app.TagState = {
            all: tags,
            current: currentTag
        };

        this.localStorageService.setObject(app.config.localStorage.tags, tagState);
    }
}
