import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, Signal, WritableSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CardGroup, CardView } from "@entities";
import { CardGrouper, GroupFunc, sum } from "@utilities";
import { CardBlobService } from "src/app/services/card-blob.service";
import { AutocompleteCardNameDirective } from "../../../directives/autocomplete-card-name.directive";
import { AutosizeDirective } from "../../../directives/autosize.directive";
import { DebounceDirective } from "../../../directives/debounce.directive";
import { CardColumnsComponent } from "../card-columns/card-columns.component";
import { DeckManagerService } from "../deck-manager/deck.manager.service";

interface ViewOption {
    name: string;
    groupFunc: GroupFunc;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./card-group.component.html",
    imports: [FormsModule, CardColumnsComponent, AutocompleteCardNameDirective, AutosizeDirective, DebounceDirective, DecimalPipe]
})
export class CardGroupComponent {

    // Input
    cardGroupId: Signal<number> = input.required<number>();

    // Inject
    private cardBlobService = inject(CardBlobService);
    private deckManager = inject(DeckManagerService);

    // State
    cardGroup: Signal<CardGroup>;
    cardViews: Signal<CardView[]>;
    price: Signal<number>;
    count: Signal<number>;
    cardBlob: Signal<string>;
    canEdit: Signal<boolean>;
    isEditing: Signal<boolean>;
    groupBy: WritableSignal<GroupFunc> = signal(CardGrouper.groupByType);
    showToolbar: WritableSignal<boolean> = signal(false);
    shouldEdit: WritableSignal<boolean> = signal(false);

    viewOptions: ViewOption[] = [{
        name: "Card Type",
        groupFunc: CardGrouper.groupByType
    },
    {
        name: "Color",
        groupFunc: CardGrouper.groupByColor
    },
    {
        name: "Mana Value",
        groupFunc: CardGrouper.groupByManaValue
    },
    {
        name: "Name",
        groupFunc: CardGrouper.groupByName
    },
    {
        name: "Price",
        groupFunc: CardGrouper.groupByPrice
    }];

    // State Tracking
    private prevCardBlob: string = null;
    private nextCardBlob: string = null;

    constructor() {

        this.cardGroup = computed(() => this.deckManager.deck().cardGroups[this.cardGroupId()]);
        this.canEdit = computed(() => this.deckManager.state().canEdit);
        this.price = computed(() => sum(this.cardGroup().cards, x => x.quantity * x.definition.price));
        this.count = computed(() => sum(this.cardGroup().cards, x => x.quantity));

        this.cardViews = computed(() => {
            const cardGroup = this.cardGroup();
            const groupBy = this.groupBy();
            return groupBy(cardGroup.cards);
        });

        this.cardBlob = computed(() => {
            const cardGroup = this.cardGroup();
            const cardViews = this.cardViews();
            return this.cardBlobService.stringify2(cardViews, cardGroup.invalidCards);
        });

        this.isEditing = computed(() => this.canEdit() && this.shouldEdit());

        if (this.deckManager.state().isNew && !this.deckManager.state().isDirty) {
            this.shouldEdit.set(true);
        }
    }

    toggleToolbar(): void {
        this.showToolbar.update(value => !value);
    }

    setGroupBy(groupBy: GroupFunc): void {
        this.groupBy.set(groupBy);
        this.showToolbar.update(value => !value);
    }

    updateCardBlob(cardBlob: string): void {
        this.nextCardBlob = cardBlob;
    }

    startEditing() {
        this.prevCardBlob = this.cardBlob();
        this.nextCardBlob = this.prevCardBlob;
        this.shouldEdit.set(true);
    }

    applyChanges() {
        this.shouldEdit.set(false);
        if (this.prevCardBlob === this.nextCardBlob) {
            return;
        }

        const parsedCards = this.cardBlobService.parse(this.nextCardBlob);
        this.deckManager.patchCardGroup(this.cardGroupId(), parsedCards);
    }

    discardChanges() {
        this.shouldEdit.set(false);
    }
}
