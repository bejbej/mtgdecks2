import * as app from "@app";
import { BehaviorSubject, Observable, of } from "rxjs";
import { delay, map, switchMap, tap } from "rxjs/operators";
import { Injectable } from "@angular/core";

interface Token {
    sub: string;
    exp: number;
}

export class User {
    isAuthenticated: boolean = false;
    id: string = "";
}

@Injectable({
    providedIn: "root"
})
export class AuthService {

    public user$: Observable<User>;
    public isLoggingIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private token$: BehaviorSubject<Token> = new BehaviorSubject<Token>(undefined);
    private tagKey = app.config.localStorage.tags;

    constructor() {
        this.user$ = this.token$.pipe(map(token => {
            return {
                isAuthenticated: token !== undefined,
                id: token?.sub ?? ""
            };
        }));

        this.token$.pipe(
            switchMap(token => {
                if (token === undefined) {
                    return of();
                }

                const expiration = token.exp * 1000;
                const now = Date.now();
                return of(undefined).pipe(delay(now - expiration));
            }),
            tap(() => this.logOut())
        ).subscribe();
    }

    logIn(): void {
        this.isLoggingIn$.next(true);
        this.token$.next({
            sub: "banana",
            exp: 1000000000
        });
        this.isLoggingIn$.next(false);
    }

    logOut(): void {
        localStorage.removeItem(this.tagKey);
        this.token$.next(undefined);
    }
}
