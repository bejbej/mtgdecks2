import { Injectable } from "@angular/core";
import { config } from "@config";
import { isNotDefined } from "@utilities";
import { fromEvent, merge, Observable, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, shareReplay } from "rxjs/operators";

interface StorageEvent2 {
    key: string;
    newValue: string | null;
}

@Injectable({
    providedIn: "root"
})
export class LocalStorageService {

    private prefix = config.localStorage.prefix;

    private storageEvent$: Observable<StorageEvent2>;

    private internalStorageEvent$: Subject<StorageEvent2> = new Subject<StorageEvent2>();

    constructor() {
        const externalStorageEvent$ = fromEvent<StorageEvent>(window, "storage").pipe(
            map(event => ({
                key: event.key,
                newValue: event.newValue
            } as StorageEvent2))
        );

        this.storageEvent$ = merge(externalStorageEvent$, this.internalStorageEvent$).pipe(shareReplay());
    }

    getItem(key: string): string | null {
        return localStorage.getItem(this.makeKey(key));
    }

    getObject<T>(key: string): T | null {
        const item = this.getItem(key);
        return isNotDefined(item) ? null : JSON.parse(item);
    }

    removeItem(key: string): void {
        const prefixedKey = this.makeKey(key);

        localStorage.removeItem(prefixedKey);
        this.internalStorageEvent$.next({
            key: prefixedKey,
            newValue: null
        });
    }

    setItem(key: string, value: string | null): void {
        if (isNotDefined(value)) {
            this.removeItem(key);
            return;
        }

        const prefixedKey = this.makeKey(key);

        localStorage.setItem(prefixedKey, value);
        this.internalStorageEvent$.next({
            key: prefixedKey,
            newValue: value
        });
    }

    setObject<T>(key: string, object: object | null): void {
        if (isNotDefined(object)) {
            this.removeItem(key);
            return;
        }

        const item = JSON.stringify(object);
        this.setItem(key, item);
    }

    /**
     * This will only emit when the value changes after this method is called.
     * @param key 
     * @returns 
     */
    watchItem(key: string): Observable<string | null> {
        const prefixedKey = this.makeKey(key);

        return this.storageEvent$.pipe(
            filter(event => event.key === prefixedKey),
            map(event => event.newValue),
            distinctUntilChanged()
        );
    }

    watchObject<T>(key: string): Observable<T | null> {
        return this.watchItem(key).pipe(
            map(value => isNotDefined(value) ? null : JSON.parse(value) as T)
        )
    }

    private makeKey(key: string): string {
        return this.prefix + key;
    }
}