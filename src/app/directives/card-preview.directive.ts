import { Directive, ElementRef, Input, OnInit, OnDestroy, NgZone } from "@angular/core";
import * as app from "@app";

@Directive({
    selector: "[card-preview]"
})
export class CardPreviewDirective implements OnInit, OnDestroy {

    @Input() imageUri;
    private element: HTMLElement;
    private url: string;
    private img: HTMLImageElement;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        this.ngZone.runOutsideAngular(() => {
            this.element = elementRef.nativeElement;
            this.img = <HTMLImageElement>document.getElementById("card-preview");

            if (!this.img) {
                this.img = document.createElement("img");
                this.img.id = "card-preview";
                document.body.appendChild(this.img);
            }
        });
    }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.url = app.config.imagesUrl.replace(/{([^}]*)}/, this.imageUri);
            this.element.addEventListener("mouseover", this.mouseOver);
            this.element.addEventListener("mouseleave", this.mouseLeave);
        });
    }

    ngOnDestroy() {
        this.ngZone.runOutsideAngular(() => {
            this.hideCardPreview();
            this.element.removeEventListener("mouseover", this.mouseOver);
            this.element.removeEventListener("mousleave", this.mouseLeave);
        });
    }

    mouseOver = () => {
        if (app.config.enableHover) {
            this.showCardPreview(this.url);
        }
    }

    mouseLeave = () => {
        this.hideCardPreview();
    }

    getOffset = () => {
        let rect = this.element.getBoundingClientRect();
        let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    };

    showCardPreview = (url: string): void => {
        let offset = this.getOffset();
        this.img.style.top = offset.top - 100 + "px";
        this.img.style.left = offset.left + this.element.offsetWidth + 20 + "px";
        this.img.src = url;
    }

    hideCardPreview = (): void => {
        if (this.img) {
            this.img.src = "";
            this.img.style.top = "-300px";
            this.img.style.left = "-200px";
        }
    }
}
