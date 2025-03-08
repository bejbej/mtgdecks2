import * as app from "@app";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-view",
    templateUrl: "./card-columns.component.html"
})
export class CardColumnsComponent {
    @Input() cardViews: app.CardView[];
}
