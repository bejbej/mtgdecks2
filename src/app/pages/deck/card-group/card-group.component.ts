import * as app from "@app";
import { BehaviorSubject, combineLatest, merge, Observable } from "rxjs";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { distinctUntilChanged, first, map, tap } from "rxjs/operators";
import { selectMany, sum } from "@array";

interface ViewOption {
    name: string;
    groupFunc: app.GroupFunc;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./card-group.component.html"
})
export class CardGroupComponent {

    @Input() cardGroupId: number;

    // Data
    cardGroup$: Observable<app.CardGroup>;
    price$: Observable<number>;
    count$: Observable<number>;
    cardBlob$: Observable<string>;
    groupBy$: BehaviorSubject<app.GroupFunc> = new BehaviorSubject<app.GroupFunc>(app.CardGrouper.groupByType);
    isEditing$: Observable<boolean>;
    canEdit$: Observable<boolean>;
    
    cardViews$: Observable<app.CardView[]>;
    shoudEdit$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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
    showToolbar: boolean = false;
    private initalCardBlob: string = null;
    private cardBlob: string = null;

    constructor(
        private cardBlobService: app.CardBlobService,
        private deckManager: app.DeckManagerService) {

            this.canEdit$ = deckManager.state$.pipe(
                map(state => state.canEdit),
                distinctUntilChanged()
            );

            const isInitiallyEditing$ = deckManager.state$.pipe(
                first(),
                map(state => state.isNew && !state.isDirty)
            );

            const isEditing$ = combineLatest([this.canEdit$, this.shoudEdit$]).pipe(
                map(([canEdit, shouldEdit]) => canEdit && shouldEdit)
            );

            this.isEditing$ = merge(isEditing$, isInitiallyEditing$).pipe(
                distinctUntilChanged()
            );

            this.cardGroup$ = deckManager.deck$.pipe(
                map(deck => deck.cardGroups[this.cardGroupId]),
                distinctUntilChanged()
            );

            this.count$ = this.cardGroup$.pipe(
                map(cardGroup => sum(cardGroup.cards, x => x.quantity)),
                distinctUntilChanged()
            );

            this.price$ = this.cardGroup$.pipe(
                map(cardGroup => sum(cardGroup.cards, x => x.quantity * x.definition.price)),
                distinctUntilChanged()
            );

            /*
            this.cardBlob$ = this.cardGroup$.pipe(
                map(cardGroup => this.cardBlobService.stringify(cardGroup.cards, cardGroup.invalidCards)),
                distinctUntilChanged()
            );
            */

            this.cardViews$ = combineLatest([this.cardGroup$, this.groupBy$]).pipe(
                map(([cardGroup, groupBy]) => groupBy(cardGroup.cards)),
                distinctUntilChanged()
            );

            this.cardBlob$ = combineLatest([this.cardGroup$, this.cardViews$]).pipe(
                map(([cardGroup, cardViews]) => {
                    const cards = selectMany(cardViews.map(x => x.cards));
                    return this.cardBlobService.stringify(cards, cardGroup.invalidCards);
                })
            ) 

            this.groupBy$.subscribe(() => this.showToolbar = false);
        }

    updateCardBlob(cardBlob: string): void {
        this.cardBlob = cardBlob;
    }

    startEditing() {
        this.shoudEdit$.next(true);
        this.cardBlob$.pipe(first()).subscribe(cardBlob => {
            this.initalCardBlob = cardBlob;
            this.cardBlob = cardBlob;
        });
    }

    applyChanges() {
        this.shoudEdit$.next(false);
        if (this.initalCardBlob === this.cardBlob) {
            return;
        }
        
        const parsedCards = this.cardBlobService.parse(this.cardBlob);
        this.deckManager.patchCardGroup(this.cardGroupId, parsedCards);
    }

    discardChanges() {
        this.shoudEdit$.next(false);
    }
}
