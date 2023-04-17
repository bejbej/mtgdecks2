import * as app from "@app";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-auth",
    templateUrl: "./auth.html"
})
export class AuthComponent implements OnInit, OnDestroy {

    isLoggedIn: boolean;
    isLoggingIn: boolean;

    private unsubscribe: Subject<void> = new Subject<void>();

    constructor(private authService: app.AuthService, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.authService.authChanged$.pipe(takeUntil(this.unsubscribe)).subscribe(() => this.sync());
        this.isLoggedIn = this.authService.isLoggedIn();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
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
            this.isLoggedIn = isLoggedIn;
            this.ref.markForCheck();
        }
    }
}
