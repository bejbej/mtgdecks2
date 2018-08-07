import { Directive, ElementRef, Input, OnInit, NgZone } from "@angular/core";

@Directive({
    selector: "input[allow-tabs],textarea[allow-tabs]"
})
export class AllowTabsDirective implements OnInit {

    private element: HTMLTextAreaElement;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        this.element = elementRef.nativeElement;
    }
    
    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.element.addEventListener("keydown", event => {
                if (event.keyCode === 9) {
                    event.preventDefault();
                    
                    let start = this.element.selectionStart;
                    let end = this.element.selectionEnd;
                    let value = this.element.value;
                    this.element.value = value.substring(0, start) + "\t" + value.substring(end);
                    this.element.selectionStart = start + 1;
                    this.element.selectionEnd  = this.element.selectionStart;
                }
            });
        });
    }
}