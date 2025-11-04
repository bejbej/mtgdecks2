import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, inject, signal, Signal } from "@angular/core";
import { DebounceDirective } from "../../../directives/debounce.directive";
import { DeckManagerService } from "../deck-manager/deck.manager.service";
import { MutableCardGroup, MutableDeck } from "../deck-manager/mutable-deck";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "edit-card-groups",
    templateUrl: "./edit-card-groups.component.html",
    imports: [DragDropModule, DebounceDirective]
})
export class EditCardGroupsComponent {

    private deckManager = inject(DeckManagerService);

    public deck: Signal<MutableDeck> = this.deckManager.deck;
    public selectedGroups: Map<MutableCardGroup, boolean> = new Map<MutableCardGroup, boolean>();

    toggleSelected(cardGroup: MutableCardGroup) {
        const prevValue = this.selectedGroups.get(cardGroup);
        const nextValue = !prevValue;
        this.selectedGroups.set(cardGroup, nextValue);
    }

    addCardGroup = () => {
        const deck = this.deck();
        const prevCardGroups = deck.cardGroups();
        const defaultGroupNames = ["Mainboard", "Sideboard", "Maybeboard"];
        const name = defaultGroupNames[prevCardGroups.length] ?? "Group";
        const newCardGroup = {
            cards: signal([]),
            invalidCards: signal([]),
            name: signal(name)
        } as MutableCardGroup;
        const nextCardGroups = [...prevCardGroups, newCardGroup];
        deck.cardGroups.set(nextCardGroups);
    }

    deleteSelectedCardGroups = () => {
        const deck = this.deck();
        const prevCardGroups = deck.cardGroups();
        const nextCardGroups = prevCardGroups.filter(cardGroup => !this.selectedGroups.get(cardGroup));
        deck.cardGroups.set(nextCardGroups);
        this.selectedGroups.clear();
    }

    drop = (event: CdkDragDrop<string>) => {
        const deck = this.deck();
        const nextCardGroups = this.deck().cardGroups().slice();
        moveItemInArray(nextCardGroups, event.previousIndex, event.currentIndex);
        deck.cardGroups.set(nextCardGroups);
    }
}