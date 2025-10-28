import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CardView } from "@entities";
import { CardPreviewDirective } from "../../../directives/card-preview.directive";
import { LightboxDirective } from "../../../directives/lightbox.directive";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-view",
    templateUrl: "./card-columns.component.html",
    imports: [CardPreviewDirective, LightboxDirective, DecimalPipe]
})
export class CardColumnsComponent {
    cardViews = input.required<CardView[]>();
}
