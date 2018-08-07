import { Component, Input, ChangeDetectionStrategy, OnChanges } from "@angular/core";
import * as app from "@app";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-view",
    templateUrl: "./cardView.html"
})
export class CardViewComponent implements OnChanges {
    @Input() columns: app.CardView[][];

    showHeaders: boolean;

    ngOnChanges() {
        this.showHeaders = this.columns.some(column => column.some(row => row.name != undefined))
    }
}
