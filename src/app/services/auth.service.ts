import { AuthService as AuthService2, SharedService } from "ng2-ui-auth";
import { Injectable } from "@angular/core";
import { Subject, Subscription, config } from "rxjs";
import { HttpClient } from "@angular/common/http";
import * as app from "@app";

@Injectable({
    providedIn: "root"
})
export class AuthService {

    private userKey = app.config.localStorage.user;
    private tagKey = app.config.localStorage.tags;
    private isAuthenticated: boolean;
    private subject: Subject<void>;
    private isLoggingIn: boolean;
    private url = app.config.usersUrl;

    constructor(private auth: AuthService2, private http: HttpClient, sharedService: SharedService) {
        sharedService.tokenName = app.config.localStorage.token;
        this.subject = new Subject();
    }

    logIn = async (): Promise<any> => {
        this.isLoggingIn = true;
        await this.auth.authenticate("google").toPromise();
        let url = this.url + "/me";
        let user = await this.http.post(url, undefined).toPromise();
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.isLoggingIn = false;
        this.updateAuthenticationStatus();
    }

    logout = async (): Promise<any> => {
        await this.auth.logout().toPromise();
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.tagKey);
        this.updateAuthenticationStatus();
    }
    
    getAuthUser = (): app.User => {
        var user = undefined;
        if (this.auth.isAuthenticated()) {
            var user = JSON.parse(localStorage.getItem(this.userKey));
            if (!user) {
                this.logout();
            }
        } else {
            if (this.isAuthenticated) {
                this.logout();
            }
        }
        return user;
    }

    isLoggedIn = (): boolean => {
        if (this.isLoggingIn) {
            return false
        }
        else if (this.auth.isAuthenticated()) {
            return true;
        }
        else {
            if (this.isAuthenticated) {
                this.logout();
            }
            return false;
        }
    }

    subscribe = (func): Subscription => {
        return this.subject.subscribe(func);
    }

    private updateAuthenticationStatus = (): void => {
        this.isAuthenticated = this.auth.isAuthenticated();
        this.subject.next();
    }
}
