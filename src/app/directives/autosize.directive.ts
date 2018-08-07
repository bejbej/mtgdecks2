import {ElementRef, Directive, Input, NgZone, SimpleChanges, OnInit, OnChanges, OnDestroy} from '@angular/core';

@Directive({
    selector: 'textarea[autosize]'
})

export class AutosizeDirective implements OnInit, OnChanges, OnDestroy {
    @Input() minRows: number;
    @Input() maxRows: number;
    @Input() ngModel: any;
    @Input() value: any;

    lastKnownWidth: any;
    resizeTimeout: number;

    constructor(private element: ElementRef, private zone: NgZone) { }

    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            this.element.nativeElement.addEventListener("input", this.adjust);
            window.addEventListener("resize", this.resizeWrapper);
        });
    }

    ngOnDestroy() {
        this.element.nativeElement.removeEventListener("input", this.adjust);
        window.removeEventListener("resize", this.resizeWrapper);
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
        if (value === this.element.nativeElement.value) {
            return;
        }

        this.element.nativeElement.value = value;
        this.adjust();
    }

    private resizeWrapper = () => {
        // Throttle resizing to every 100ms
        if (this.resizeTimeout) {
            return;
        }

        this.resizeTimeout = window.setTimeout(() => {
            delete this.resizeTimeout;
            this.resize();
        }, 100);
    }

    private resize = () => {
        let previousWidth = this.lastKnownWidth;
        let currentWidth = this.element.nativeElement.offsetWidth;
        this.lastKnownWidth = currentWidth;
        // Only resize if this element's width changed
        if (currentWidth !== previousWidth) {
            this.adjust();
        }
    }

    private adjust = () => {
        if (!this.element) {
            return;
        }
        
        let element = this.element.nativeElement;
        element.style.overflow = 'hidden';
        element.style.height = 'auto';

        let lineHeight = this.getLineHeight(element);
        let height = element.scrollHeight;
        let rowsCount = height / lineHeight;
        if (this.minRows && this.minRows >= rowsCount) {
            element.style.overflow = 'auto';
            height = this.minRows * lineHeight;

        } else if(this.maxRows && this.maxRows <= rowsCount) {
            element.style.overflow = 'auto';
            height = this.maxRows * lineHeight;
        }
        element.style.height = height + "px";
    }

    private getLineHeight = (element) => {
        let lineHeight = parseInt(element.style.lineHeight, 10);
        if (isNaN(lineHeight)) {
            let fontSize = window.getComputedStyle(element, null).getPropertyValue('font-size');
            lineHeight = Math.floor(parseInt(fontSize.replace('px','')) * 1.5);
        }

        return lineHeight;
    }
}