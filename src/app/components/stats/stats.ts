import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import * as app from "@app";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-stats",
    templateUrl: "./stats.html"
})
export class StatsComponent implements OnInit {
    @Input() update: Observable<app.Card[]>;
    stats: string[];

    private static cardTypes = app.Dictionary.fromArray(["creature", "artifact", "enchantment", "planeswalker", "instant", "sorcery"], x => x);

    constructor(private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.update.subscribe(cards => {
            this.computeStats(cards);
            this.ref.markForCheck();
        });
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
