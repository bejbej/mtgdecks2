import * as app from "@app";
import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { distinctUntilChanged, map } from "rxjs/operators";
import { Observable } from "rxjs";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.html"
})
export class StatsComponent implements OnInit {
    stats$: Observable<string[]>;

    private static cardTypes = toDictionary(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"], x => x);

    constructor(private deckEvents: app.DeckManager) { }

    ngOnInit() {
        this.stats$ = this.deckEvents.state$.pipe(
            map(state => state.deck.cardGroups[state.deck.cardGroupOrder[0]]),
            distinctUntilChanged(),
            map(cardGroup => this.computeStats(cardGroup?.cards ?? []))
        )
    }

    private computeStats = (cards: app.Card[]): string[] => {
        if (!cards) {
            return [];
        }

        let stats = new Array(17).fill(0);

        for (let card of cards) {
            if (StatsComponent.cardTypes[card.definition.primaryType] !== undefined) {
                stats[card.definition.cmc] += card.quantity;
            }
        };

        for (var i = stats.length - 1; i > -1 && stats[i] === 0; --i) {
            stats.pop();
        }

        return stats.map(stat => new Array(stat).fill("X").join(""));
    }
}
