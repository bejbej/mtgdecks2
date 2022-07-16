import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { contains } from "@array";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { toDictionary } from "@dictionary";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.html"
})
export class StatsComponent implements OnInit, OnDestroy {
    @Input() deck: app.Deck;
    stats: string[];

    private unsubscribe: Subject<void> = new Subject<void>();

    private static cardTypes = toDictionary(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"], x => x);

    constructor(
        private ref: ChangeDetectorRef,
        private deckEvents: app.DeckEvents) {
            this.deckEvents.cardGroupCardsChanged$.pipe(takeUntil(this.unsubscribe)).subscribe(cardGroups => {
                if (contains(cardGroups, this.deck.cardGroups[0])) {
                    this.computeStats(this.deck.cardGroups[0].cards);
                    this.ref.markForCheck();
                }
            });
        }

    ngOnInit() {
    }

    ngOnDestroy(): void {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    private computeStats = (cards: app.Card[]) => {
        if (!cards) {
            delete this.stats;
            return;
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

        this.stats = stats.map(stat => new Array(stat).fill("X").join(""));
    }
}
