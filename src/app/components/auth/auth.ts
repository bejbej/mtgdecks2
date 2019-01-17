import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import * as app from "@app";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-auth",
    templateUrl: "./auth.html"
})
export class AuthComponent implements OnInit, OnDestroy {

    isLoggedIn: boolean;
    isLoggingIn: boolean;

    private authSubscription: Subscription;

    constructor(private authService: app.AuthService, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.authSubscription = this.authService.subscribe(() => this.sync());
        this.isLoggedIn = this.authService.isAuthenticated();
    }

    ngOnDestroy() {
        this.authSubscription.unsubscribe();
    }

    login = async () => {
        this.isLoggingIn = true;
        try
        {
            await this.authService.signIn();
        }
        finally
        {
            this.isLoggingIn = false;
            this.ref.markForCheck();
        }
    }

    logout = () => {
        return this.authService.signOut();
    }

    private sync = () => {
        let isAuthenticated = this.authService.isAuthenticated();
        if (this.isLoggedIn !== isAuthenticated) {
            this.isLoggedIn = isAuthenticated;
            this.ref.markForCheck();
        }
    }
}
