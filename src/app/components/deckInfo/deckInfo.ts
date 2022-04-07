import * as app from "@app";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { first, takeUntil } from "rxjs/operators";
import { Location } from "@angular/common";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-deck-info",
    templateUrl: "./deckInfo.html"
})
export class DeckInfoComponent implements OnInit, OnDestroy {

    tags: string;

    private unsubscribe: Subject<void> = new Subject<void>();

    @Input() deck: app.Deck;
    @Input() canEdit$: Observable<boolean>;
    @Output() deckChanged: EventEmitter<void> = new EventEmitter<void>();

    ngOnInit(): void {
        this.tags = this.deck.tags.join(", ");
    }

    ngOnDestroy(): void {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    tagsChanged = () => {
        if (this.tags.length === 0) {
            this.deck.tags = [];
        }
        else {
            this.deck.tags = this.tags.split(/\s*,\s*/).map(x => x.toLowerCase());
        }
        
        this.deckChanged.next();
    }
}