import { Component } from "@angular/core";

@Component({
    selector: "app-notfound",
    templateUrl: "./notfound.html"
})
export class NotfoundComponent {
    constructor() {
        document.title = "Page Not Found";
    }
}
