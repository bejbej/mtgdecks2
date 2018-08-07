import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";

export class Cancellable<T> {

    promise: Promise<T>;
    cancel: () => void;

    static fromObservable<T>(observable: Observable<T>): Cancellable<T> {
        let c = new Cancellable<T>();

        c.promise = new Promise((resolve, reject) => {
            let subscription = observable.pipe(catchError(error => {
                reject(error);
                throw error;
            })).subscribe(resolve);
            c.cancel = () => subscription.unsubscribe();
        });

        return c;
    }
}