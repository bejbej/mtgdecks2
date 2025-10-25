import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { config } from "@config";
import { isDefined, isNotDefined } from "@utilities";
import { AuthConfig, OAuthService } from "angular-oauth2-oidc";
import { BehaviorSubject, EMPTY, from, Observable, of } from "rxjs";
import { audit, catchError, delay, distinctUntilKeyChanged, filter, map, shareReplay, startWith, switchMap, tap } from "rxjs/operators";
import { LocalStorageService } from "./local-storage.service";

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
    private localStorageService = inject(LocalStorageService);

    public user$: Observable<User>;
    public isLoggingIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private isInitialized: Observable<boolean>;

    constructor() {

        this.localStorageService.watchItem(config.localStorage.accessToken).pipe(
            delay(0),
            switchMap(accessToken => this.getIdentity(accessToken)),
            tap(identity => this.localStorageService.setObject(config.localStorage.identity, identity)),
        ).subscribe();

        this.localStorageService.watchObject<Identity>(config.localStorage.identity).pipe(
            startWith(this.localStorageService.getObject<Identity>(config.localStorage.identity)),
            switchMap(identity => this.delayUntilExpiration(identity)),
            audit(() => this.isInitialized),
            tap(() => this.refresh())
        ).subscribe();

        this.localStorageService.watchObject<Identity>(config.localStorage.identity).pipe(
            filter(identity => isDefined(identity)),
            tap(() => this.isLoggingIn$.next(false))
        ).subscribe();

        this.user$ = this.localStorageService.watchObject<Identity>(config.localStorage.identity).pipe(
            startWith(this.localStorageService.getObject<Identity>(config.localStorage.identity)),
            map(identity => {
                return {
                    isAuthenticated: isDefined(identity),
                    id: identity?.sub ?? ""
                }
            }),
            distinctUntilKeyChanged("id"),
            shareReplay()
        );

        this.oauthService.events.subscribe(event => {
            console.log(event);
        });

        this.isInitialized = from(this.init());
    }

    logIn(): void {
        this.isLoggingIn$.next(true);
        this.oauthService.initImplicitFlowInPopup()
            .catch(() => this.isLoggingIn$.next(false));
    }

    logOut(): void {
        this.oauthService.logOut();
    }

    refresh(): void {
        this.oauthService.silentRefresh({
            login_hint: this.oauthService.getIdentityClaims().email
        }).catch(x => this.logOut())
    }

    private init(): Promise<boolean> {
        const authConfig: AuthConfig = {
            issuer: config.auth.issuer,
            strictDiscoveryDocumentValidation: false,
            clientId: config.auth.clientId,
            redirectUri: config.auth.redirectUri,
            scope: config.auth.scope,
            silentRefreshRedirectUri: config.auth.redirectUri,
            disableIdTokenTimer: true,
        };

        this.oauthService.configure(authConfig);
        return this.oauthService.loadDiscoveryDocumentAndTryLogin();
    }

    private getIdentity(accessToken: string | null): Observable<Identity | null> {
        if (isNotDefined(accessToken)) {
            return of(null);
        }

        const options = {
            headers: new HttpHeaders({
                Authorization: `Bearer ${accessToken}`
            })
        };

        return this.http.post<Identity>(config.auth.authUrl, null, options).pipe(
            catchError(() => {
                this.isLoggingIn$.next(false);
                this.logOut();
                return EMPTY;
            })
        );
    }

    private delayUntilExpiration(identity: Identity | null): Observable<void> {
        if (isNotDefined(identity)) {
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
