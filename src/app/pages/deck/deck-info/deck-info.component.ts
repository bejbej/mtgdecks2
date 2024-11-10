import * as app from "@app";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { distinctUntilChanged, map } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deck-info.component.html"
})
export class DeckInfoComponent {

    tags$: Observable<string[]>;
    tagsInput$: Observable<string>;
    notes$: Observable<string>;
    canEdit$: Observable<boolean>;

    constructor(private deckManager: app.DeckManagerService) {

        this.canEdit$ = deckManager.state$.pipe(
            map(state => state.canEdit),
            distinctUntilChanged()
        );

        this.tags$ = this.deckManager.deck$.pipe(
            map(deck => deck.tags),
            distinctUntilChanged()
        );

        this.tagsInput$ = this.tags$.pipe(
            map(tags => tags.join(", ")),
            distinctUntilChanged()
        );

        this.notes$ = this.deckManager.deck$.pipe(
            map(deck => deck.notes),
            distinctUntilChanged()
        );
    }

    updateTags = (tagsInput: string): void => {
        const tags = tagsInput.length === 0 ? [] : tagsInput.split(/\s*,\s*/).map(x => x.toLowerCase());
        this.deckManager.patchDeck({ tags });
    }
    
    updateNotes = (notes: string): void => {
        this.deckManager.patchDeck({ notes });
    }
}