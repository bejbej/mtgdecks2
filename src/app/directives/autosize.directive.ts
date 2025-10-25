import { AfterContentInit, Directive, ElementRef, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { Throttle } from "@utilities";

@Directive({
    selector: 'textarea[autosize]',
    standalone: false
})

export class AutosizeDirective implements OnInit, OnChanges, AfterContentInit, OnDestroy {
    adjustThrottle: Throttle = new Throttle(100, () => this.adjust());
    element: any;

    constructor(element: ElementRef, private zone: NgZone) {
        this.element = element.nativeElement;
    }

    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            this.element.style.overflow = "hidden";
            this.element.addEventListener("input", this.adjust);
            window.addEventListener("resize", this.adjustWrapper);
        });
    }

    ngAfterContentInit() {
        this.zone.runOutsideAngular(() => {
            this.adjust();
        });
    }

    ngOnDestroy() {
        this.zone.runOutsideAngular(() => {
            this.element.removeEventListener("input", this.adjust);
            window.removeEventListener("resize", this.adjustWrapper);
            this.adjustThrottle.clear();
        });
    }

    ngOnChanges(simpleChange: SimpleChanges) {
        let value: any;

        if (simpleChange.value !== undefined) {
            value = simpleChange.value.currentValue;
        }
        else if (simpleChange.ngModel !== undefined) {
            value = simpleChange.ngModel.currentValue;
        }
        else {
            return;
        }

        // If the value is the same as the current element value there's no need to resize
        if (value === this.element.value) {
            return;
        }

        this.element.value = value;
        this.adjust();
    }

    private adjustWrapper = () => {
        this.adjustThrottle.invoke();
    }

    private adjust = () => {
        if (!this.element) {
            return;
        }

        let documentScroll = document.documentElement.scrollTop;
        let bodyScroll = document.body.scrollTop;
        let currentScroll = documentScroll == 0 ? bodyScroll : documentScroll;
        this.element.style.height = "auto";
        this.element.style.height = this.element.scrollHeight + "px";
        document.documentElement.scrollTop = currentScroll;
        document.body.scrollTop = currentScroll;
    }
}