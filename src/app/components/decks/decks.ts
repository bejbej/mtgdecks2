import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { distinct, orderBy, selectMany } from "@array";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-decks",
    templateUrl: "./decks.html"
})
export class DecksComponent implements OnInit, OnDestroy {

    decks: app.Deck[];
    visibleDecks: app.Deck[];
    tags: string[] = [];
    isLoading: boolean;
    currentTag: string;
    currentTagName: string;

    private unsubscribe: Subject<void> = new Subject<void>();
    private cancelLoadingDecks: Subject<void> = new Subject<void>();

    constructor(
        private authService: app.AuthService,
        private deckService: app.DeckService,
        private ref: ChangeDetectorRef) {

        document.title = "My Decks";
        let tagState = <app.TagState>JSON.parse(localStorage.getItem(app.config.localStorage.tags));
        if (tagState) {
            this.tags = tagState.all.sort();
            this.currentTag = tagState.current;
        }

        this.updateCurrentTagName();
        authService.getObservable().pipe(takeUntil(this.unsubscribe)).subscribe(() => this.sync());
    }

    ngOnInit() {
        this.sync();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
        this.cancelLoadingDecks.next();
        this.cancelLoadingDecks.complete();
    }

    onCurrentTagChanged = () => {
        let tagState = {
            all: this.tags,
            current: this.currentTag
        };

        localStorage.setItem(app.config.localStorage.tags, JSON.stringify(tagState));
        this.updateCurrentTagName();
        this.filterDecks();
    }

    private loadDecks = async () => {
        if (this.isLoading) {
            return;
        }

        let user = this.authService.getAuthUser();
        if (!user) {
            return;
        }

        this.isLoading = true;
        try {
            let decks$ = this.deckService.getByQuery({ owner: user.id }).pipe(takeUntil(this.unsubscribe));
            this.decks = await app.firstValue(decks$);
            this.onDecksLoaded();
        }
        finally {
            this.isLoading = false;
            this.ref.markForCheck();
        }
    }

    private onDecksLoaded = () => {
        this.decks = orderBy(this.decks, deck => deck.name);
        this.tags = distinct(selectMany(this.decks.map(note => note.tags))).sort();
        if (this.currentTag && this.tags.indexOf(this.currentTag) === -1) {
            this.currentTag = undefined;
        }
        this.onCurrentTagChanged();
    }

    private filterDecks = () => {
        if (!this.decks || this.decks.length === 0) {
            delete this.visibleDecks;
            return;
        }

        switch (this.currentTag) {
            case undefined:
                this.visibleDecks = this.decks;
                break;
            case null:
                this.visibleDecks = this.decks.filter(deck => deck.tags.length === 0);
                break;
            default:
                this.visibleDecks = this.decks.filter(deck => deck.tags.indexOf(this.currentTag) > -1);
        }
    }

    private updateCurrentTagName = () => {
        this.currentTagName = this.currentTag === undefined ? "All" : this.currentTag === null ? "Untagged" : this.currentTag;
    }

    private sync = () => {
        let authUser = this.authService.getAuthUser();

        if (authUser) {
            this.loadDecks();
            return;
        }

        delete this.decks;
        delete this.visibleDecks;
        delete this.currentTag;
        this.isLoading = false;
        this.tags = [];
        this.updateCurrentTagName();
        this.cancelLoadingDecks.next();
    }
}
