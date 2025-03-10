import * as app from "@app";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Dictionary } from "@types";
import { distinctUntilChanged, map } from "rxjs/operators";
import { except } from "@array";
import { Observable } from "rxjs";
import { toDictionary2 } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "edit-card-groups",
    templateUrl: "./edit-card-groups.component.html",
    standalone: false
})
export class EditCardGroupsComponent {

    cardGroups$: Observable<Dictionary<app.CardGroup>>;
    cardGroupOrder$: Observable<number[]>;
    selectedGroups: any = {};

    constructor(private deckManager: app.DeckManagerService) {
        this.cardGroups$ = this.deckManager.deck$.pipe(
            map(deck => deck.cardGroups),
            distinctUntilChanged(),
        )

        this.cardGroupOrder$ = this.deckManager.deck$.pipe(
            map(deck => deck.cardGroupOrder),
            distinctUntilChanged(),
        )
    }

    updateCardGroupName(cardGroupKey: number, name: string): void {
        this.deckManager.patchCardGroup(cardGroupKey, { name });
    }

    addCardGroup = () => {
        this.deckManager.updateDeck(prevDeck => {
            const defaultGroupNames = ["Mainboard", "Sideboard", "Maybeboard"];
            const name = defaultGroupNames[prevDeck.cardGroupOrder.length] || "Group";
            const cardGroupId = Math.max(0, ...prevDeck.cardGroupOrder) + 1;

            return {
                ...prevDeck,
                cardGroups: {
                    ...prevDeck.cardGroups,
                    [cardGroupId]: {
                        cards: [],
                        invalidCards: [],
                        name: name
                    }
                },
                cardGroupOrder: [...prevDeck.cardGroupOrder, cardGroupId]
            };
        });
    }

    deleteSelectedCardGroups = () => {
        const deletedCardGroupIds = Object.keys(this.selectedGroups)
            .filter(i => this.selectedGroups[i] === true)
            .map(x => Number(x));

        this.deckManager.updateDeck(prevDeck => {
            const nextCardGroupOrder = except(prevDeck.cardGroupOrder, deletedCardGroupIds);
            const nextCardGroups = toDictionary2(nextCardGroupOrder, x => x, cardGroupId => prevDeck.cardGroups[cardGroupId]);
            
            return {
                ...prevDeck,
                cardGroups: nextCardGroups,
                cardGroupOrder: nextCardGroupOrder
            };
        });

        this.selectedGroups = {};
    }

    drop = (event: CdkDragDrop<string>) => {
        this.deckManager.updateDeck(prevDeck => {
            const nextCardGroupOrder = prevDeck.cardGroupOrder.slice();
            moveItemInArray(nextCardGroupOrder, event.previousIndex, event.currentIndex);

            return {
                ...prevDeck,
                cardGroupOrder: nextCardGroupOrder
            };
        });
    }
}