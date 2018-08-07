import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { Subscription } from "rxjs";
import * as app from "@app";

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

    private decksSubscription: app.Cancellable<app.Deck[]>;
    private authSubscription: Subscription;

    constructor(
        private authService: app.AuthService,
        private deckService: app.DeckService,
        private ref: ChangeDetectorRef) {

        document.title = "My Decks";
        let tagState = <app.TagState>JSON.parse(localStorage.getItem(app.config.localStorage.tags));
        if (tagState) {
            this.tags = tagState.all.sort();
            this.currentTag = tagState.current;
            this.updateCurrentTagName();
        }
        this.authSubscription = authService.subscribe(() => this.sync());
    }

    ngOnInit() {
        this.sync();
    }

    ngOnDestroy() {
        this.authSubscription.unsubscribe();

        if (this.decksSubscription) {
            this.decksSubscription.cancel();
        }
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
        let user = this.authService.getAuthUser();
        if (!user) {
            return;
        }

        this.isLoading = true;
        this.decksSubscription = this.deckService.getByQuery({ owner: user.id });
        try {
            this.decks = await this.decksSubscription.promise;
            this.onDecksLoaded();
        }
        finally {
            this.isLoading = false;
            delete this.decksSubscription;
            this.ref.markForCheck();
        }
    }

    private onDecksLoaded = () => {
        this.decks = this.decks.sort((a, b) => a.name > b.name ? 1 : -1);
        this.tags = app.Dictionary.toArray<string>(this.decks.reduce((dictionary, deck) => {
            deck.tags.forEach(tag => {
                dictionary[tag] = tag;
            });
            return dictionary;
        }, {})).sort();
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

        if (!authUser) {
            delete this.decks;
            delete this.visibleDecks;
            delete this.currentTag;
            this.tags = [];
            this.updateCurrentTagName();
            if (this.decksSubscription) {
                this.decksSubscription.cancel();
                delete this.decksSubscription;
            }
        }
        else if (!this.decksSubscription && !this.decks) {
            this.loadDecks();
        }
    }
}
