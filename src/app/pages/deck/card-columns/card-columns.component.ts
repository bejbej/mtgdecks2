import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CardView } from "@entities";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-view",
    templateUrl: "./card-columns.component.html",
    standalone: false
})
export class CardColumnsComponent {
    cardViews = input.required<CardView[]>();
}
