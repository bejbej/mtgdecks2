import { Directive, ElementRef, Input, OnInit, NgZone } from "@angular/core";
import * as app from "@app";

@Directive({
    selector: "[lightbox]"
})
export class LightboxDirective implements OnInit {

    @Input() imageUri: string;
    private element: HTMLElement;
    private url: string;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        this.element = elementRef.nativeElement;
    }
    
    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.url = app.config.imagesUrl.replace(/{([^}]*)}/, this.imageUri);
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