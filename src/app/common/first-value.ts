import { Observable, Subscription } from "rxjs";

export function firstValue<T>(observable: Observable<T>): Promise<T> {
    let subscription = new Subscription();

    return new Promise<T>((resolve, reject) => {
        let next = value => {
            subscription.unsubscribe();
            resolve(value);
        }

        let error = error => {
            subscription.unsubscribe();
            reject(error);
        }

        subscription.add(observable.subscribe(next, error, reject));
    });
}
