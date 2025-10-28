import { ChangeDetectionStrategy, Component, computed, Signal, inject } from "@angular/core";
import { hasLength } from "@utilities";
import { AllowTabsDirective } from "../../../directives/allow-tabs.directive";
import { AutosizeDirective } from "../../../directives/autosize.directive";
import { DebounceDirective } from "../../../directives/debounce.directive";
import { DeckManagerService } from "../deck-manager/deck.manager.service";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deck-info.component.html",
    imports: [DebounceDirective, AllowTabsDirective, AutosizeDirective]
})
export class DeckInfoComponent {
    private deckManager = inject(DeckManagerService);


    canEdit: Signal<boolean>;
    tags: Signal<string[]>;
    notes: Signal<string>;
    tagsInput: Signal<string>;

    constructor() {
        this.canEdit = computed(() => this.deckManager.state().canEdit);
        this.tags = computed(() => this.deckManager.deck().tags);
        this.notes = computed(() => this.deckManager.deck().notes);
        this.tagsInput = computed(() => this.deckManager.deck().tags.join(", "));
    }

    updateTags = (tagsInput: string): void => {
        const tags = hasLength(tagsInput) ? tagsInput.split(/\s*,\s*/).map(x => x.toLowerCase()) : [];
        this.deckManager.patchDeck({ tags });
    }

    updateNotes = (notes: string): void => {
        this.deckManager.patchDeck({ notes });
    }
}