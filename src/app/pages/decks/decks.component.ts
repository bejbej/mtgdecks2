import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, Signal, WritableSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { config } from "@config";
import { QueriedDeck, TagState } from "@entities";
import { distinct, hasNoLength, orderBy } from "@utilities";
import { of } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { AuthService } from "src/app/services/auth.service";
import { DeckService } from "src/app/services/deck.service";
import { LocalStorageService } from "src/app/services/local-storage.service";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-decks",
    templateUrl: "./decks.component.html",
    standalone: false
})
export class DecksComponent {

    private authService = inject(AuthService);
    private deckService = inject(DeckService);
    private localStorageService = inject(LocalStorageService);

    visibleDecks: Signal<QueriedDeck[]>;
    tags: Signal<string[]>;
    currentTag: WritableSignal<string> = signal(null);
    currentTagName: Signal<string>;
    isLoading: Signal<boolean>;

    constructor() {

        document.title = "My Decks";

        const tagState = this.localStorageService.getObject<TagState>(config.localStorage.tags);
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
                    return of({ isLoading: false, decks: [] as QueriedDeck[] });
                }

                return this.deckService.getByQuery({ owner: user.id }).pipe(
                    map(decks => ({ isLoading: false, decks: orderBy(decks, x => x.name) })),
                    startWith({ isLoading: true, decks: [] as QueriedDeck[] })
                );
            })
        );

        const state = toSignal(state$);
        this.isLoading = computed(() => state().isLoading);
        this.visibleDecks = computed(() => this.filterDecks(state().decks, this.currentTag()));
        const deckTags = computed(() => {
            const decks = state().decks;
            const tags = distinct(decks.map(deck => deck.tags).flat());
            return orderBy(tags, x => x);
        });
        this.tags = computed(() => state().isLoading ? storedTags : deckTags());

        effect(() => this.persistTagState(this.tags(), this.currentTag()));
    }

    updateCurrentTag(tag: string | null | undefined) {
        this.currentTag.set(tag);
    }

    private filterDecks(decks: QueriedDeck[], tag: string): QueriedDeck[] {
        switch (tag) {
            case undefined:
                return decks;
            case null:
                return decks.filter(deck => hasNoLength(deck.tags));
            default:
                return decks.filter(deck => deck.tags.includes(tag));
        }
    }

    private persistTagState(tags: string[], currentTag: string): void {
        const tagState: TagState = {
            all: tags,
            current: currentTag
        };

        this.localStorageService.setObject(config.localStorage.tags, tagState);
    }
}
