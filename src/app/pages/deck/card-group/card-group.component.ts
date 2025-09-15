import * as app from "@app";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, Signal, WritableSignal } from "@angular/core";
import { selectMany, sum } from "@array";

interface ViewOption {
    name: string;
    groupFunc: app.GroupFunc;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./card-group.component.html",
    standalone: false
})
export class CardGroupComponent {

    // Input
    cardGroupId: Signal<number> = input.required<number>();

    // Inject
    private cardBlobService = inject(app.CardBlobService);
    private deckManager = inject(app.DeckManagerService);

    // State
    cardGroup: Signal<app.CardGroup>;
    cardViews: Signal<app.CardView[]>;
    price: Signal<number>;
    count: Signal<number>;
    cardBlob: Signal<string>;
    canEdit: Signal<boolean>;
    isEditing: Signal<boolean>;
    groupBy: WritableSignal<app.GroupFunc> = signal(app.CardGrouper.groupByType);
    showToolbar: WritableSignal<boolean> = signal(false);
    shouldEdit: WritableSignal<boolean> = signal(false);

    viewOptions: ViewOption[] = [{
        name: "Card Type",
        groupFunc: app.CardGrouper.groupByType
    },
    {
        name: "Color",
        groupFunc: app.CardGrouper.groupByColor
    },
    {
        name: "Mana Value",
        groupFunc: app.CardGrouper.groupByManaValue
    },
    {
        name: "Name",
        groupFunc: app.CardGrouper.groupByName
    },
    {
        name: "Price",
        groupFunc: app.CardGrouper.groupByPrice
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

    setGroupBy(groupBy: app.GroupFunc): void {
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
