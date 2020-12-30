import * as app from "@app";
import { Directive, ElementRef, Input, NgZone, OnInit } from "@angular/core";

@Directive({
    selector: "[lightbox]"
})
export class LightboxDirective implements OnInit {

    @Input() scryfallId: string;
    private element: HTMLElement;
    private url: string;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        this.element = elementRef.nativeElement;
    }
    
    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.url = app.config.imagesUrl.replace(/{([^}]*)}/, this.scryfallId);
            this.element.addEventListener("click", event => {
                event.preventDefault();
                this.showLightbox();
            });
        });
    }

    showLightbox = () => {
        let lightbox = document.createElement("div");
        lightbox.className = "lightbox";

        let img = document.createElement("img");
        img.src = this.url;

        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        if ((height * 3) >> 2 > width) {
            img.style.width = "90%";
        }
        else {
            img.style.height = "90%";
        }

        lightbox.appendChild(img);

        lightbox.addEventListener("click", () => {
            lightbox.remove();
        });

        document.body.appendChild(lightbox);
    }
}