import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthComponent } from "../../components/auth/auth.component";

@Component({
    selector: "app-notfound",
    templateUrl: "./not-found.component.html",
    imports: [RouterLink, AuthComponent]
})
export class NotfoundComponent {
    constructor() {
        document.title = "Page Not Found";
    }
}
