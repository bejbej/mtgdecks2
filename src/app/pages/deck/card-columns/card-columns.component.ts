import * as app from "@app";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-view",
    templateUrl: "./card-columns.component.html",
    standalone: false
})
export class CardColumnsComponent {
    cardViews = input.required<app.CardView[]>();
}
