import { Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal, Signal, WritableSignal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Deck } from "@entities";
import { isDefined, isNotDefined } from "@utilities";
import { Subject } from "rxjs";
import { distinctUntilChanged, map, takeUntil, tap } from "rxjs/operators";
import { AuthComponent } from "../../components/auth/auth.component";
import { LargeSpinner } from "../../components/large-spinner/large-spinner.component";
import { SpinnerComponent } from "../../components/spinner/spinner.component";
import { DebounceDirective } from "../../directives/debounce.directive";
import { CardGroupComponent } from "./card-group/card-group.component";
import { DeckInfoComponent } from "./deck-info/deck-info.component";
import { DeckManagerService } from "./deck-manager/deck.manager.service";
import { EditCardGroupsComponent } from "./edit-card-groups/edit-card-groups.component";
import { StatsComponent } from "./stats/stats.component";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DeckManagerService],
    selector: "app-deck",
    templateUrl: "./deck.component.html",
    imports: [RouterLink, AuthComponent, LargeSpinner, DebounceDirective, SpinnerComponent, EditCardGroupsComponent, CardGroupComponent, DeckInfoComponent, StatsComponent]
})
export class DeckComponent implements OnDestroy {

    // inject
    private deckManager = inject(DeckManagerService);
    private location = inject(Location);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    // state
    canEdit: Signal<boolean>;
    deck: Signal<Deck | undefined>;
    isDeleting: Signal<boolean>
    isEditingGroups: Signal<boolean>
    isLoading: Signal<boolean>
    showPrices: WritableSignal<boolean> = signal(false);
    private shouldEditGroups: WritableSignal<boolean> = signal(false);

    private unsubscribe: Subject<void> = new Subject<void>();

    constructor() {

        document.title = "Loading...";

        // Load a new deck each time route params change
        this.route.params.pipe(
            map(params => params.id),
            distinctUntilChanged(),
            tap(id => this.deckManager.loadDeck(id)),
            takeUntil(this.unsubscribe)
        ).subscribe();

        this.canEdit = computed(() => this.deckManager.state().canEdit);
        this.deck = this.deckManager.deck;
        this.isLoading = computed(() => isNotDefined(this.deckManager.state().deck));
        this.isDeleting = computed(() => {
            const state = this.deckManager.state();
            return state.isDeleted && state.isDirty;
        });
        this.isEditingGroups = computed(() => this.deckManager.state().canEdit && this.shouldEditGroups());

        // Update the page name whenever the deck's name changes
        effect(() => {
            const deck = this.deck();
            if (isDefined(deck)) {
                document.title = deck.name;
            }
        });

        // Update the page url when the deck's id changes
        const deckId = computed(() => this.deck()?.id);
        effect(() => {
            if (isDefined(deckId())) {
                this.location.replaceState("/decks/" + deckId());
            }
        })

        // Navigate to the dacks page when the deck is deleted and persisted
        effect(() => {
            const state = this.deckManager.state();
            if (state.isDeleted && !state.isDirty) {
                this.router.navigateByUrl("/decks");
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    togglePrices() {
        this.showPrices.update(value => !value);
    }

    toggleEditGroups() {
        this.shouldEditGroups.update(value => !value);
    }

    updateName = (name: string): void => {
        this.deckManager.patchDeck({ name });
    }

    delete = async () => {
        if (confirm("Are you sure you want to delete this deck?")) {
            this.deckManager.deleteDeck();
        }
    }
}
