import * as app from "@app";
import { ChangeDetectionStrategy, Component, computed, Signal } from "@angular/core";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.component.html",
    standalone: false
})
export class StatsComponent {

    stats: Signal<string[]>;

    private static cardTypes = toDictionary(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"], x => x);

    constructor(private deckManager: app.DeckManagerService)
    {
        this.stats = computed(() => {
            const deck = this.deckManager.deck();
            const firstCardGroup = deck.cardGroups[deck.cardGroupOrder[0]];
            return this.computeStats(firstCardGroup?.cards ?? []);
        });
    }

    private computeStats = (cards: app.Card[]): string[] => {
        if (!cards) {
            return [];
        }

        let stats = new Array(17).fill(0);

        for (let card of cards) {
            if (StatsComponent.cardTypes[card.definition.primaryType] !== undefined) {
                stats[card.definition.manaValue] += card.quantity;
            }
        };

        for (var i = stats.length - 1; i > -1 && stats[i] === 0; --i) {
            stats.pop();
        }

        return stats.map(stat => new Array(stat).fill("X").join(""));
    }
}
