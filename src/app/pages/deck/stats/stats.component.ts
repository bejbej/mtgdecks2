import { ChangeDetectionStrategy, Component, computed, inject, Signal } from "@angular/core";
import { Card } from "@entities";
import { firstOrUndefined } from "@utilities";
import { DeckManagerService } from "../deck-manager/deck.manager.service";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.component.html"
})
export class StatsComponent {
    private deckManager = inject(DeckManagerService);

    stats: Signal<string[]>;

    private cardTypes = new Set(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"]);

    constructor() {
        this.stats = computed(() => {
            const firstCardGroup = firstOrUndefined(this.deckManager.deck().cardGroups());
            return this.computeStats(firstCardGroup?.cards() ?? []);
        });
    }

    private computeStats = (cards: Card[]): string[] => {
        const stats = new Array(17).fill(0);

        for (let card of cards) {
            if (this.cardTypes.has(card.definition.primaryType)) {
                stats[card.definition.manaValue] += card.quantity;
            }
        };

        for (let i = stats.length - 1; i > -1 && stats[i] === 0; --i) {
            stats.pop();
        }

        return stats.map(stat => new Array(stat).fill("X").join(""));
    }
}
