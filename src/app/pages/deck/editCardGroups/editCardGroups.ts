import * as app from "@app";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "edit-card-groups",
    templateUrl: "./editCardGroups.html"
})
export class EditCardGroupsComponent {

    selectedGroups: any = {};

    @Input() deck: app.Deck;

    constructor(private deckEvents: app.DeckEvents) { }

    addCardGroup = () => {
        const defaultGroupNames = ["Mainboard", "Sideboard", "Maybeboard"];
        const name = defaultGroupNames[this.deck.cardGroups.length] || "Group";

        this.deck.cardGroups.push({
            cardBlob: "",
            cards: [],
            invalidCards: [],
            name: name
        });
        this.cardGroupsChanged();
    }

    deleteSelectedCardGroups = () => {
        const selectedCardGroupIndices = Object.keys(this.selectedGroups).filter(i => this.selectedGroups[i] === true).map(x => parseInt(x));
        for (let i = selectedCardGroupIndices.length - 1; i > -1; --i) {
            const index = selectedCardGroupIndices[i];
            this.deck.cardGroups.splice(index , 1);
        }
        this.selectedGroups = {};
        this.cardGroupsChanged();
    }

    drop = (event: CdkDragDrop<string>) => {
        moveItemInArray(this.deck.cardGroups, event.previousIndex, event.currentIndex);
        this.cardGroupsChanged();
    }

    cardGroupsChanged = () => {
        this.deckEvents.cardGroupsChanged$.next(this.deck.cardGroups);
    }
}