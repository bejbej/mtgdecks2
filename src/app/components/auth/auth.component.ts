import * as app from "@app";
import { ChangeDetectionStrategy, Component, inject, Signal } from "@angular/core";
import { map } from "rxjs/operators";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-auth",
    templateUrl: "./auth.component.html",
    standalone: false
})
export class AuthComponent {

    private authService = inject(app.AuthService);

    isLoggedIn: Signal<boolean>;
    isLoggingIn: Signal<boolean>;

    constructor() {
        this.isLoggedIn = toSignal(this.authService.user$.pipe(map(user => user.isAuthenticated)));
        this.isLoggingIn = toSignal(this.authService.isLoggingIn$);
    }

    login(): void {
        this.authService.logIn()
    }

    logout(): void {
        this.authService.logOut();
    }
}
