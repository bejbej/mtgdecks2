import { ChangeDetectionStrategy, Component, inject, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { AuthService } from "src/app/services/auth.service";
import { SpinnerComponent } from "../spinner/spinner.component";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-auth",
    templateUrl: "./auth.component.html",
    imports: [SpinnerComponent]
})
export class AuthComponent {

    private authService = inject(AuthService);

    isLoggedIn: Signal<boolean>;
    isLoggingIn: Signal<boolean>;

    constructor() {
        this.isLoggedIn = toSignal(this.authService.user$.pipe(map(user => user.isAuthenticated)), { initialValue: false });
        this.isLoggingIn = toSignal(this.authService.isLoggingIn$, { initialValue: false });
    }

    login(): void {
        this.authService.logIn()
    }

    logout(): void {
        this.authService.logOut();
    }
}
