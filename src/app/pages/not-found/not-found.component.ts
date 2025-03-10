import { Component } from "@angular/core";

@Component({
    selector: "app-notfound",
    templateUrl: "./not-found.component.html",
    standalone: false
})
export class NotfoundComponent {
    constructor() {
        document.title = "Page Not Found";
    }
}
