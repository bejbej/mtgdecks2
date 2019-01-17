import { AuthService as AuthService2 } from "angularx-social-login";
import { Injectable } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { HttpClient } from "@angular/common/http";
import * as app from "@app";

@Injectable({
    providedIn: "root"
})
export class AuthService {

    private userKey = app.config.localStorage.user;
    private tagKey = app.config.localStorage.tags;
    private tokenKey = app.config.localStorage.token;
    private _isAuthenticated: boolean;
    private subject: Subject<void>;
    private isLoggingIn: boolean;
    private url = app.config.usersUrl;

    constructor(private auth: AuthService2, private http: HttpClient) {
        this.subject = new Subject();
    }

    signIn = async (): Promise<any> => {
        if (this.isLoggingIn || this._isAuthenticated) {
            return;
        }
        
        this.isLoggingIn = true;
        try
        {
            let googleResponse = await this.auth.signIn("google");
            let authResponse = await this.http.post<{token: string}>(app.config.authClients.google.authUrl, { access_token: googleResponse.authToken}).toPromise();
            let token = authResponse.token;
            let options = { headers: { "Authorization": "Bearer " + token } };
            let user = await this.http.post(this.url + "/me", undefined, options).toPromise();
            localStorage.setItem(this.tokenKey, token);
            localStorage.setItem(this.userKey, JSON.stringify(user));
        }
        finally {
            this.isLoggingIn = false;
            this.updateAuthenticationStatus();
        }
    }

    signOut = async (): Promise<any> => {
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.tagKey);
        localStorage.removeItem(this.tokenKey);
        this.updateAuthenticationStatus();
    }
    
    getAuthUser = (): app.User => {
        return JSON.parse(localStorage.getItem(this.userKey));
    }

    isAuthenticated = (): boolean => {
        return this.getAuthUser() != null;
    }

    subscribe = (func): Subscription => {
        return this.subject.subscribe(func);
    }

    private updateAuthenticationStatus = (): void => {
        let isAuthenticated = localStorage.getItem(this.tokenKey) != null;
        if (this._isAuthenticated !== isAuthenticated) {
            this._isAuthenticated = isAuthenticated;
            this.subject.next();
        }
    }
}
