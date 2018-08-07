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
        this.isLoggedIn = this.authService.isLoggedIn()
    }

    ngOnDestroy() {
        this.authSubscription.unsubscribe();
    }

    login = async () => {
        this.isLoggingIn = true;
        try
        {
            await this.authService.logIn();
        }
        finally
        {
            this.isLoggingIn = false;
            this.ref.markForCheck();
        }
    }

    logout = () => {
        return this.authService.logout();
    }

    private sync = () => {
        let isLoggedIn = this.authService.isLoggedIn();
        if (this.isLoggedIn !== isLoggedIn) {
            this.isLoggedIn = this.authService.isLoggedIn();
            this.ref.markForCheck();
        }
    }
}
