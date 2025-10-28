import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject, input } from "@angular/core";
import { config } from "@config";
import { CardDefinition } from "@entities";
import { createImageUri } from "@utilities";

@Directive({ selector: "[card-preview]" })
export class CardPreviewDirective implements OnInit, OnDestroy {
    private ngZone = inject(NgZone);
    private elementRef: ElementRef<HTMLElement> = inject(ElementRef);
    private element = this.elementRef.nativeElement

    readonly cardDefinition = input.required<CardDefinition>();
    private img!: HTMLImageElement;

    constructor() {
        this.ngZone.runOutsideAngular(() => {
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
        if (config.enableHover) {
            this.showCardPreview();
        }
    }

    mouseLeave = () => {
        this.hideCardPreview();
    }

    showCardPreview = (): void => {
        const imageUri = createImageUri(this.cardDefinition().imageId);
        let rect = this.element.getBoundingClientRect();

        let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let top = Math.max(Math.min(rect.top, document.documentElement.clientHeight - 200), 100) - 100;
        let left = rect.left > 242 && rect.left + this.element.offsetWidth + 232 > document.documentElement.clientWidth ?
            rect.left - 242 :
            rect.left + this.element.offsetWidth + 20;

        this.img.style.top = top + scrollTop + "px";
        this.img.style.left = left + scrollLeft + "px";
        this.img.src = `${config.imagesUrl}/front/${imageUri}`;
    }

    hideCardPreview = (): void => {
        if (this.img) {
            this.img.src = "";
            this.img.style.top = "-300px";
            this.img.style.left = "-200px";
        }
    }
}
