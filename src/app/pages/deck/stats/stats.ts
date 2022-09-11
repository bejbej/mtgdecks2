import * as app from "@app";
import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import { Observable } from "rxjs";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.html"
})
export class StatsComponent implements OnInit {
    @Input() deck: app.Deck;

    stats$: Observable<string[]>;

    private static cardTypes = toDictionary(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"], x => x);

    constructor(private deckEvents: app.DeckEvents) { }

    ngOnInit() {
        // Update stats whenever the first card group changes
        this.stats$ = this.deckEvents.deckChanged$
            .pipe(
                startWith(this.deck),
                map(deck => deck.cardGroups.length === 0 ? [] : deck.cardGroups[0].cards),
                distinctUntilChanged(),
                map(cards => this.computeStats(cards))
            )
    }

    private computeStats = (cards: app.Card[]): string[] => {
        if (!cards) {
            return [];
        }

        let stats = new Array(17).fill(0);

        cards.forEach(card => {
            if (StatsComponent.cardTypes[card.definition.primaryType] === undefined) {
                return;
            }

            stats[card.definition.cmc] += card.quantity;
        });

        for (var i = stats.length - 1; i > -1 && stats[i] === 0; --i) {
            stats.pop();
        }

        return stats.map(stat => new Array(stat).fill("X").join(""));
    }
}
