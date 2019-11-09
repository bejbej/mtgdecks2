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
                    let previousLength = this.element.value.length;
                    let start = this.element.selectionStart;
                    let end = this.element.selectionEnd;
                    let selectionLength = end > start ? end - start : start - end;
                    let expectedLength = previousLength + 1 - selectionLength;
                    document.execCommand("insertText", false, "\t");
                    if (expectedLength != this.element.value.length) {
                        // https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
                        // if for some reason the insert didn't work, we have to manually add it in
                        let value = this.element.value;
                        this.element.value = value.substring(0, start) + "\t" + value.substring(end);
                        this.element.selectionStart = start + 1;
                        this.element.selectionEnd  = this.element.selectionStart;
                    }
                }
            });
        });
    }
}