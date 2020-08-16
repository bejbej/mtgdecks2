import { Component, ElementRef, NgZone, OnDestroy, OnInit } from "@angular/core";

@Component({
    selector: "app-spinner",
    templateUrl: "./spinner.html"
})
export class SpinnerComponent implements OnInit, OnDestroy {

    index = 0;
    states = "0123".split("");
    intervalId = undefined;

    constructor(private myElement: ElementRef, private ngZone: NgZone) { }

    ngOnInit() {
        let element = this.myElement.nativeElement.childNodes[0];

        let spin = () => {
            element.textContent = this.states[this.index];
            this.index = this.index + 1 >= this.states.length ? 0 : this.index + 1;
        }

        spin();
        this.ngZone.runOutsideAngular(() => {
            this.intervalId = window.setInterval(spin, 150);
        });
    }

    ngOnDestroy() {
        if (this.intervalId) {
            this.ngZone.runOutsideAngular(() => {
                window.clearInterval(this.intervalId);
            });
        }
    }
}
