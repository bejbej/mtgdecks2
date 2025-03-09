import * as app from "@app";
import { AuthConfig, OAuthService } from "angular-oauth2-oidc";
import { BehaviorSubject, EMPTY, identity, Observable, of } from "rxjs";
import { catchError, delay, distinctUntilKeyChanged, filter, map, retry, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

export interface Identity {
    sub: string;
    iat: number;
    exp: number;
    accessToken: string;
}

export class User {
    isAuthenticated: boolean = false;
    id: string = "";
}

@Injectable({
    providedIn: "root"
})
export class AuthService {

    private oauthService = inject(OAuthService);
    private http = inject(HttpClient);
    private localStorageService = inject(app.LocalStorageService);

    public user$: Observable<User>;
    public isLoggingIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() {

        this.localStorageService.watchItem(app.config.localStorage.accessToken).pipe(
            delay(0),
            switchMap(accessToken => this.getIdentity(accessToken)),
            tap(identity => this.localStorageService.setObject(app.config.localStorage.identity, identity)),
        ).subscribe();

        this.localStorageService.watchObject<Identity>(app.config.localStorage.identity).pipe(
            startWith(this.localStorageService.getObject<Identity>(app.config.localStorage.identity)),
            switchMap(identity => this.delayUntilExpiration(identity)),
            tap(() => this.refresh())
        ).subscribe();

        this.localStorageService.watchObject<Identity>(app.config.localStorage.identity).pipe(
            filter(identity => identity !== null),
            tap(() => this.isLoggingIn$.next(false))
        ).subscribe();

        this.user$ = this.localStorageService.watchObject<Identity>(app.config.localStorage.identity).pipe(
            startWith(this.localStorageService.getObject<Identity>(app.config.localStorage.identity)),
            map(identity => {
                return {
                    isAuthenticated: identity !== null,
                    id: identity?.sub ?? ""
                }
            }),
            distinctUntilKeyChanged("id"),
            shareReplay()
        );

        this.init();
    }

    logIn(): void {
        this.isLoggingIn$.next(true);
        this.oauthService.initImplicitFlowInPopup()
            .catch(() => this.isLoggingIn$.next(false));
    }

    logOut(): void {
        this.oauthService.logOut();
    }

    private refresh(): void {
        this.oauthService.silentRefresh({
            login_hint: this.oauthService.getIdentityClaims().email
        });
    }

    private init() {
        const authConfig: AuthConfig = {
            issuer: app.config.auth.issuer,
            strictDiscoveryDocumentValidation: false,
            clientId: app.config.auth.clientId,
            redirectUri: app.config.auth.redirectUri,
            scope: app.config.auth.scope,
            silentRefreshRedirectUri: app.config.auth.redirectUri
        };

        this.oauthService.configure(authConfig);
        this.oauthService.loadDiscoveryDocumentAndTryLogin();
    }

    private getIdentity(accessToken: string | null): Observable<Identity | null> {
        if (accessToken === null) {
            return of(null);
        }

        const options = {
            headers: new HttpHeaders({
                Authorization: `Bearer ${accessToken}`
            })
        };

        return this.http.post<Identity>(app.config.auth.authUrl, null, options).pipe(
            catchError(() => {
                this.isLoggingIn$.next(false);
                this.logOut();
                return EMPTY;
            })
        );
    }

    private delayUntilExpiration(identity: Identity | null): Observable<void> {
        if (identity === null) {
            return of();
        }

        const absoluteExpiration = identity.exp * 1000;
        const now = Date.now();
        const relativeExpiration = (absoluteExpiration - now) * 0.9;

        if (relativeExpiration < 0) {
            return of(undefined);
        }

        return of(undefined).pipe(delay(relativeExpiration));
    }
}
