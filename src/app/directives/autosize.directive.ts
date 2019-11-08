import { ElementRef, Directive, Input, NgZone, SimpleChanges, OnInit, OnChanges, OnDestroy, AfterContentInit } from '@angular/core';
import * as app from "@app";

@Directive({
    selector: 'textarea[autosize]'
})

export class AutosizeDirective implements OnInit, OnChanges, AfterContentInit, OnDestroy {
    adjustThrottle: app.Throttle = new app.Throttle(100, () => this.adjust());
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