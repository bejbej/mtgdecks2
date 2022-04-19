import { Observable, Subject, Subscription } from "rxjs";
import { takeUntil } from "rxjs/operators";



export class SubscriptionManager {

    unsubscribe$: Subject<void> = new Subject<void>();

    observe<T>(observable: Observable<T>) {
        return observable.pipe(takeUntil(this.unsubscribe$));
    }

    unsubscribeAll(): void {
        this.unsubscribe$;
        this.unsubscribe$.complete();
    }
}