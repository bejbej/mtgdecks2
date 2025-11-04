import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, Signal, WritableSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CardView } from "@entities";
import { CardGrouper, GroupFunc, hasNoLength, sum } from "@utilities";
import { CardBlobService } from "src/app/services/card-blob.service";
import { AutocompleteCardNameDirective } from "../../../directives/autocomplete-card-name.directive";
import { AutosizeDirective } from "../../../directives/autosize.directive";
import { DebounceDirective } from "../../../directives/debounce.directive";
import { CardColumnsComponent } from "../card-columns/card-columns.component";
import { DeckManagerService } from "../deck-manager/deck.manager.service";
import { MutableCardGroup } from "../deck-manager/mutable-deck";

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
export class CardGroupComponent implements OnInit {

    // Input
    cardGroup: Signal<MutableCardGroup> = input.required<MutableCardGroup>();

    // Inject
    private cardBlobService = inject(CardBlobService);
    private deckManager = inject(DeckManagerService);

    // State
    cardViews: Signal<CardView[]>;
    price: Signal<number>;
    count: Signal<number>;
    cardBlob: Signal<string>;
    canEdit: Signal<boolean> = this.deckManager.canEdit;
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
    private prevCardBlob: string = "";
    private nextCardBlob: string = "";

    constructor() {

        this.price = computed(() => sum(this.cardGroup().cards(), x => x.quantity * x.definition.price));
        this.count = computed(() => sum(this.cardGroup().cards(), x => x.quantity));

        this.cardViews = computed(() => {
            const groupBy = this.groupBy();
            const cards = this.cardGroup().cards();
            return groupBy(cards);
        });

        this.cardBlob = computed(() => {
            const cardViews = this.cardViews();
            const invalidCards = this.cardGroup().invalidCards();
            return this.cardBlobService.stringify2(cardViews, invalidCards);
        });

        this.isEditing = computed(() => this.canEdit() && this.shouldEdit());
    }

    ngOnInit(): void {
        const shouldInitiallyEdit = this.deckManager.isNew() &&
            hasNoLength(this.cardGroup().cards()) &&
            hasNoLength(this.cardGroup().invalidCards());
        if (shouldInitiallyEdit) {
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

        const { cards, invalidCards } = this.cardBlobService.parse(this.nextCardBlob);
        this.cardGroup().cards.set(cards);
        this.cardGroup().invalidCards.set(invalidCards);
    }

    discardChanges() {
        this.shouldEdit.set(false);
    }
}
