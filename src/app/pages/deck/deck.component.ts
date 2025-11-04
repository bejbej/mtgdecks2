import { Location } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, Signal, WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { hasLength, isDefined } from "@utilities";
import { distinctUntilChanged, map, tap } from "rxjs/operators";
import { AuthComponent } from "../../components/auth/auth.component";
import { LargeSpinner } from "../../components/large-spinner/large-spinner.component";
import { SpinnerComponent } from "../../components/spinner/spinner.component";
import { DebounceDirective } from "../../directives/debounce.directive";
import { CardGroupComponent } from "./card-group/card-group.component";
import { DeckInfoComponent } from "./deck-info/deck-info.component";
import { DeckManagerService } from "./deck-manager/deck.manager.service";
import { MutableDeck } from "./deck-manager/mutable-deck";
import { EditCardGroupsComponent } from "./edit-card-groups/edit-card-groups.component";
import { StatsComponent } from "./stats/stats.component";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DeckManagerService],
    selector: "app-deck",
    templateUrl: "./deck.component.html",
    imports: [RouterLink, AuthComponent, LargeSpinner, DebounceDirective, SpinnerComponent, EditCardGroupsComponent, CardGroupComponent, DeckInfoComponent, StatsComponent]
})
export class DeckComponent {

    // inject
    private deckManager = inject(DeckManagerService);
    private location = inject(Location);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);

    // state
    deck: Signal<MutableDeck> = this.deckManager.deck;
    canEdit: Signal<boolean> = this.deckManager.canEdit;
    canSave: Signal<boolean> = this.deckManager.canSave;
    canDelete: Signal<boolean> = computed(() => !this.deckManager.isNew() && this.canEdit() && !this.isDeleting());
    isLoading: Signal<boolean> = this.deckManager.isLoading;
    isDeleting: Signal<boolean> = this.deckManager.isDeleting;
    isEditingGroups: Signal<boolean> = computed(() => this.canEdit() && this.tryEditGroups());
    isPriceVisible: WritableSignal<boolean> = signal(false);

    private tryEditGroups: WritableSignal<boolean> = signal(false);

    constructor() {

        document.title = "Loading...";

        // Load a new deck each time route params change
        this.route.params.pipe(
            map(params => params.id),
            distinctUntilChanged(),
            tap(id => this.deckManager.setDeckId(id)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();

        // Update the page name whenever the deck's name changes
        effect(() => {
            if (!this.isLoading()) {
                document.title = this.deck().name();
            }
        });

        // Update the page url when the deck's id changes
        effect(() => {
            const id = this.deck().id();
            if (hasLength(id)) {
                this.location.replaceState("/decks/" + id);
            }
        })

        // Navigate to the dacks page when the deck is deleted and persisted
        effect(() => {
            if (this.deckManager.isDeleted()) {
                this.router.navigateByUrl("/decks");
            }
        });
    }

    togglePrices() {
        this.isPriceVisible.update(value => !value);
    }

    toggleEditGroups() {
        this.tryEditGroups.update(value => !value);
    }

    updateName = (name: string): void => {
        const deck = this.deck();
        if (isDefined(deck)) {
            deck.name.set(name);
        }
    }

    delete = () => {
        if (confirm("Are you sure you want to delete this deck?")) {
            this.deckManager.setDeleted();
        }
    }
}
