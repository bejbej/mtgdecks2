import * as app from "@app";
import { BehaviorSubject, combineLatest, merge, Observable } from "rxjs";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { distinctUntilChanged, first, map, tap } from "rxjs/operators";
import { sum } from "@array";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-card-group",
    templateUrl: "./cardGroup.html"
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
    
    columns$: Observable<app.CardView[][]>;
    shoudEdit$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    cardGrouper = app.CardGrouper;

    // State Tracking
    showToolbar: boolean = false;
    private initalCardBlob: string = null;
    private cardBlob: string = null;

    constructor(
        private cardBlobService: app.CardBlobService,
        private deckManager: app.DeckManager) {

            const state$ = deckManager.state$;

            this.canEdit$ = state$.pipe(
                map(state => state.canEdit),
                distinctUntilChanged()
            );

            const isInitiallyEditing$ = state$.pipe(
                first(),
                map(state => state.isNew && !state.isDirty)
            );

            const isEditing$ = combineLatest([this.canEdit$, this.shoudEdit$]).pipe(
                map(([canEdit, shouldEdit]) => canEdit && shouldEdit)
            );

            this.isEditing$ = merge(isEditing$, isInitiallyEditing$).pipe(
                distinctUntilChanged()
            );

            this.cardGroup$ = state$.pipe(
                map(state => state.deck.cardGroups[this.cardGroupId]),
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

            this.cardBlob$ = this.cardGroup$.pipe(
                map(cardGroup => this.cardBlobService.stringify(cardGroup.cards, cardGroup.invalidCards)),
                distinctUntilChanged()
            );

            this.columns$ = combineLatest([this.cardGroup$, this.groupBy$]).pipe(
                map(([cardGroup, groupBy]) => groupBy(cardGroup.cards)),
                distinctUntilChanged()
            );
        }

    updateCardBlob(cardBlob: string): void {
        this.cardBlob = cardBlob;
    }

    setGroupFunc(func: app.GroupFunc) {
        this.showToolbar = false;
        this.groupBy$.next(func);
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
