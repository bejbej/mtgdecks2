import * as app from "@app";
import { AuthService as AuthService2, SharedService } from "ng2-ui-auth";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

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
        if (this.isLoggingIn || this.isAuthenticated) {
            return;
        }

        this.isLoggingIn = true;
        try {
            await app.firstValue(this.auth.authenticate("google"));
            let url = this.url + "/me";
            let user = await app.firstValue(this.http.post(url, undefined));
            localStorage.setItem(this.userKey, JSON.stringify(user));
        }
        catch {
            await app.firstValue(this.auth.logout());
        }
        finally {
            this.isLoggingIn = false;
            this.updateAuthenticationStatus();
        }
    }

    logout = async (): Promise<any> => {
        await app.firstValue(this.auth.logout());
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

    getObservable = (): Observable<void> => this.subject.asObservable();

    private updateAuthenticationStatus = (): void => {
        let isAuthenticated = this.auth.isAuthenticated();
        if (this.isAuthenticated !== isAuthenticated) {
            this.isAuthenticated = this.auth.isAuthenticated();
            this.subject.next();
        }
    }
}
