import * as app from "@app";
import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit } from "@angular/core";

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
                this.img.style.position = "absolute";
                this.img.style.height = "300px";
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

    showCardPreview = (url: string): void => {
        let rect = this.element.getBoundingClientRect();

        let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let top = Math.max(Math.min(rect.top, document.documentElement.clientHeight - 200), 100) - 100;
        let left = rect.left > 242 && rect.left + this.element.offsetWidth + 232 > document.documentElement.clientWidth ?
            rect.left - 242 :
            rect.left + this.element.offsetWidth + 20;

        this.img.style.top = top + scrollTop + "px";
        this.img.style.left = left + scrollLeft + "px";
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
