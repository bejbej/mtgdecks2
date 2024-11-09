import * as app from "@app";
import { AuthService as AuthService2, SharedService } from "ng2-ui-auth";
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

    constructor(private auth: AuthService2, sharedService: SharedService) {
        sharedService.tokenName = app.config.localStorage.token;

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

        this.token$.next(this.auth.getPayload() as Token);
    }

    logIn(): void {
        this.isLoggingIn$.next(true);
        this.auth.authenticate("google").pipe(
            tap(() => {
                const token = this.auth.getPayload() as Token;
                this.token$.next(token);
            })
        ).subscribe({
            error: () => this.isLoggingIn$.next(false),
            complete: () => this.isLoggingIn$.next(false)
        });
    }

    logOut(): void {
        this.auth.removeToken();
        localStorage.removeItem(this.tagKey);
        this.token$.next(undefined);
    }
}
