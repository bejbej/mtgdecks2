import * as app from "@app";
import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deckInfo.html"
})
export class DeckInfoComponent implements OnInit {

    tags: string;
    canEdit$ = this.deckEvents.canEdit$;
    deckChanged$ = this.deckEvents.deckChanged$;

    @Input() deck: app.Deck;

    constructor(private deckEvents: app.DeckEvents) { }

    ngOnInit(): void {
        this.tags = this.deck.tags.join(", ");
    }

    tagsChanged = () => {
        if (this.tags.length === 0) {
            this.deck.tags = [];
        }
        else {
            this.deck.tags = this.tags.split(/\s*,\s*/).map(x => x.toLowerCase());
        }
        
        this.deckEvents.deckChanged$.next(this.deck);
    }
}