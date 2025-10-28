import { AfterContentInit, Directive, ElementRef, inject, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { isDefined, Throttle } from "@utilities";

@Directive({ selector: 'textarea[autosize]' })

export class AutosizeDirective implements OnInit, OnChanges, AfterContentInit, OnDestroy {
    private zone = inject(NgZone);
    private elementRef = inject(ElementRef);
    private element = this.elementRef.nativeElement;

    adjustThrottle: Throttle = new Throttle(100, () => this.adjust());

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

        if (isDefined(simpleChange.value)) {
            value = simpleChange.value.currentValue;
        }
        else if (isDefined(simpleChange.ngModel)) {
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