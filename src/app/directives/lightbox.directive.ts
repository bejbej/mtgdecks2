import { Directive, ElementRef, NgZone, OnInit, inject, input } from "@angular/core";
import { config } from "@config";
import { CardDefinition } from "@entities";
import { createImageUri } from "@utilities";

@Directive({ selector: "[lightbox]" })
export class LightboxDirective implements OnInit {
    private ngZone = inject(NgZone);
    private elemetRef: ElementRef<HTMLElement> = inject(ElementRef);
    private element = this.elemetRef.nativeElement;

    readonly cardDefinition = input.required<CardDefinition>();

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.element.addEventListener("click", event => {
                event.preventDefault();
                this.showLightbox();
            });
        });
    }

    showLightbox = () => {
        if (this.cardDefinition().isDoubleSided) {
            this.doubleSided();
        }
        else {
            this.singleSided();
        }
    }

    singleSided = () => {
        const imageUri = createImageUri(this.cardDefinition().imageId);

        const lightbox = document.createElement("div");
        lightbox.className = "lightbox";

        const img = document.createElement("img");
        img.src = `${config.imagesUrl}/front/${imageUri}`;

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
        const imageUri = createImageUri(this.cardDefinition().imageId);

        const lightbox = document.createElement("div");
        lightbox.className = "lightbox";

        const imgFront = document.createElement("img");
        imgFront.src = `${config.imagesUrl}/front/${imageUri}`;

        const imgBack = document.createElement("img");
        imgBack.src = `${config.imagesUrl}/back/${imageUri}`;

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