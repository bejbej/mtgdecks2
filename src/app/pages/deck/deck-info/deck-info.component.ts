import { ChangeDetectionStrategy, Component, computed, inject, Signal } from "@angular/core";
import { hasLength } from "@utilities";
import { AllowTabsDirective } from "../../../directives/allow-tabs.directive";
import { AutosizeDirective } from "../../../directives/autosize.directive";
import { DebounceDirective } from "../../../directives/debounce.directive";
import { DeckManagerService } from "../deck-manager/deck.manager.service";
import { MutableDeck } from "../deck-manager/mutable-deck";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deck-info.component.html",
    imports: [DebounceDirective, AllowTabsDirective, AutosizeDirective]
})
export class DeckInfoComponent {
    private deckManager = inject(DeckManagerService);

    deck: Signal<MutableDeck> = this.deckManager.deck;
    canEdit: Signal<boolean> = this.deckManager.canEdit;
    tags: Signal<string[]> = computed(() => this.deckManager.deck().tags());
    notes: Signal<string> = computed(() => this.deckManager.deck().notes());
    tagsInput: Signal<string> = computed(() => this.tags().join(", "));

    updateTags(tagsInput: string): void {
        const tags = hasLength(tagsInput) ? tagsInput.split(/\s*,\s*/).map(x => x.toLowerCase()) : [];
        this.deckManager.deck().tags.set(tags);
    }

    updateNotes(notes: string): void {
        this.deckManager.deck().notes.set(notes);
    }
}