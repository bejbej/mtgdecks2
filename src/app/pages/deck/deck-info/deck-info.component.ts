import * as app from "@app";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deck-info.component.html",
    standalone: false
})
export class DeckInfoComponent {

    canEdit: Signal<boolean>;
    tags: Signal<string[]>;
    notes: Signal<string>;
    tagsInput: Signal<string>;

    constructor(private deckManager: app.DeckManagerService) {
        this.canEdit = computed(() => this.deckManager.state().canEdit);
        this.tags = computed(() => this.deckManager.deck().tags);
        this.notes = computed(() => this.deckManager.deck().notes);
        this.tagsInput = computed(() => this.deckManager.deck().tags.join(", "));
    }

    updateTags = (tagsInput: string): void => {
        const tags = tagsInput.length === 0 ? [] : tagsInput.split(/\s*,\s*/).map(x => x.toLowerCase());
        this.deckManager.patchDeck({ tags });
    }
    
    updateNotes = (notes: string): void => {
        this.deckManager.patchDeck({ notes });
    }
}