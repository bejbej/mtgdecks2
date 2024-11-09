import * as app from "@app";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-auth",
    templateUrl: "./auth.html"
})
export class AuthComponent {

    isLoggedIn$: Observable<boolean>;
    isLoggingIn$: Observable<boolean>;

    constructor(private authService: app.AuthService) {
        this.isLoggedIn$ = authService.user$.pipe(map(user => user.isAuthenticated));
        this.isLoggingIn$ = authService.isLoggingIn$;
    }

    login(): void {
        this.authService.logIn()
    }

    logout(): void {
        this.authService.logOut();
    }
}
