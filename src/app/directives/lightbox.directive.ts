import * as app from "@app";
import { Directive, ElementRef, Input, NgZone, OnInit } from "@angular/core";

@Directive({
    selector: "[lightbox]"
})
export class LightboxDirective implements OnInit {

    @Input() cardDefinition: app.CardDefinition;
    private element: HTMLElement;

    constructor(elementRef: ElementRef, private ngZone: NgZone) {
        this.element = elementRef.nativeElement;
    }
    
    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.element.addEventListener("click", event => {
                event.preventDefault();
                this.showLightbox();
            });
        });
    }

    showLightbox = () => {
        if (this.cardDefinition.isDoubleSided) {
            this.doubleSided();
        }
        else {
            this.singleSided();
        }
    }

    singleSided = () => {
        const lightbox = document.createElement("div");
        lightbox.className = "lightbox";

        const img = document.createElement("img");
        img.src = `${app.config.imagesUrl}/front/${this.cardDefinition.imageUri}.jpg`;

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

    doubleSided = () => {
        const lightbox = document.createElement("div");
        lightbox.className = "lightbox";

        const imgFront = document.createElement("img");
        imgFront.src = `${app.config.imagesUrl}/front/${this.cardDefinition.imageUri}.jpg`;

        const imgBack = document.createElement("img");
        imgBack.src = `${app.config.imagesUrl}/back/${this.cardDefinition.imageUri}.jpg`;

        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        if ((height * 3) >> 1 > width) {
            imgFront.style.width = "45%";
            imgBack.style.width = "45%";
        }
        else {
            imgFront.style.height = "90%";
            imgBack.style.height = "90%";
        }

        lightbox.appendChild(imgFront);
        lightbox.appendChild(imgBack);

        lightbox.addEventListener("click", () => {
            lightbox.remove();
        });

        document.body.appendChild(lightbox);
    }
}