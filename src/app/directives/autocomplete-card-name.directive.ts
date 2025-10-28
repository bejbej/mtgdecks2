import { Directive, ElementRef, NgZone, OnInit } from "@angular/core";
import { CardDefinition } from "@entities";
import { getAutocompleteEntries, getCaretCoordinates, isNotDefined, Throttle } from "@utilities";
import { CardDefinitionService } from "../services/card-definition.service";

interface QueryResult {
    query: string;
    startIndex: number;
    endIndex: number;
}

@Directive({ selector: "input[autocomplete-card-name],textarea[autocomplete-card-name]" })
export class AutocompleteCardNameDirective implements OnInit {

    element: HTMLTextAreaElement;
    autocompleteDiv: HTMLDivElement;
    isVisible: boolean;
    cards: CardDefinition[];
    currentCardNames: string[];
    currentQuery: QueryResult;
    isAutocompleteBoxActive: boolean;
    isInsertingValue: boolean;
    autocompleteThrottle: Throttle = new Throttle(100, () => this.computeAutocomplete());
    selectedAutocompleteIndex: number = 0;

    readonly minimumNumberOfCharacters: number = 1;
    readonly maximumNumberOfMatches: number = 8;

    constructor(cardDefinitionService: CardDefinitionService, elementRef: ElementRef, private ngZone: NgZone) {
        this.cards = cardDefinitionService.getCardArray();
        this.element = elementRef.nativeElement;
    }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.createAutoCompleteElement();

            this.element.addEventListener("input", () => {
                // If text was inserted by autocomplete action we don't want to trigger the autocomplete box
                if (!this.isInsertingValue) {
                    this.autocompleteThrottle.invoke();
                }
            });

            this.element.addEventListener("keydown", (event: KeyboardEvent) => {
                if (!this.isVisible) {
                    return;
                }
                else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    const computedIndex = this.selectedAutocompleteIndex + 1;
                    const nextIndex = computedIndex > this.currentCardNames.length - 1 ? 0 : computedIndex;
                    this.updateSelectedAutocompleteIndex(nextIndex);
                }
                else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    const computedIndex = this.selectedAutocompleteIndex - 1;
                    const nextIndex = computedIndex < 0 ? this.currentCardNames.length - 1 : computedIndex;
                    this.updateSelectedAutocompleteIndex(nextIndex);
                }
                else if (event.key === "Escape" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    this.hideAutocomplete();
                }
                else if (event.key === "Tab") {
                    event.preventDefault();
                    if (this.isVisible) {
                        this.insertAutocomplete2(this.autocompleteDiv.childNodes[this.selectedAutocompleteIndex].childNodes[1].textContent);
                    }
                }
            });

            this.element.addEventListener("blur", () => {
                // if the autocomplete box is active because the user is currently clicking on it, we don't want to hide it
                if (!this.isAutocompleteBoxActive) {
                    this.hideAutocomplete();
                }
            });

            this.element.addEventListener("click", () => this.hideAutocomplete());
        });
    }

    ngOnDestroy() {
        this.ngZone.runOutsideAngular(() => {
            this.autocompleteDiv.remove();
            this.autocompleteThrottle.clear();
        });
    }

    createAutoCompleteElement(): void {
        this.autocompleteDiv = document.createElement("div");
        this.autocompleteDiv.className = "autocomplete";
        this.autocompleteDiv.style.display = "none";

        for (let i = 0; i < this.maximumNumberOfMatches; ++i) {
            const entry = document.createElement("div");
            entry.appendChild(document.createElement("b"));
            entry.appendChild(document.createElement("span"));
            this.autocompleteDiv.appendChild(entry);

            entry.addEventListener("mousedown", () => {
                const clickHandler = () => {
                    window.removeEventListener("click", clickHandler);
                    this.insertAutocomplete2(entry.childNodes[1].textContent);
                };

                window.addEventListener("click", clickHandler);
                this.isAutocompleteBoxActive = true;
            });
        }

        document.body.appendChild(this.autocompleteDiv);
    }

    computeAutocomplete(): void {
        this.hideAutocomplete();
        if (this.element.selectionStart != this.element.selectionEnd) {
            return;
        }
        let result = this.getQuery(this.element.value, this.element.selectionStart);
        if (isNotDefined(result) || result.query.length < this.minimumNumberOfCharacters) {
            return;
        }
        let cards = getAutocompleteEntries(this.cards, result.query, x => x.name.toLowerCase(), this.maximumNumberOfMatches);
        if (cards.length == 0) {
            return;
        }
        this.currentCardNames = cards.map(card => card.name);
        this.currentQuery = result;
        if (this.currentCardNames.length == 1 && result.query.length == this.currentCardNames[0].length) {
            return;
        }
        this.updateAutocompleteDisplay();
        this.updateSelectedAutocompleteIndex(0);
        this.updateAutocompleteLocation();
        this.showAutocomplete();
    }

    insertAutocomplete2(text: string): void {
        this.autocompleteThrottle.clear();
        this.insertValue(text);
        this.hideAutocomplete();
    }

    insertValue(value: string): void {
        this.element.focus();
        this.element.selectionStart = this.currentQuery.endIndex;
        this.element.selectionEnd = this.currentQuery.endIndex;
        this.isInsertingValue = true;
        let previousLength = this.element.value.length;
        document.execCommand("insertText", false, value);
        if (previousLength == this.element.value.length) {
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
            // if for some reason the insert didn't work, we have to manually add it in
            this.element.value = this.element.value.substring(0, this.currentQuery.endIndex) + value + this.element.value.substring(this.currentQuery.endIndex);
            this.element.selectionStart = this.currentQuery.endIndex + value.length;
            this.element.selectionEnd = this.element.selectionStart;
            this.element.focus();
        }
        this.isInsertingValue = false;
    }

    showAutocomplete(): void {
        if (!this.isVisible) {
            this.isVisible = true;
            this.autocompleteDiv.style.display = "";
        }
    }

    updateAutocompleteDisplay(): void {
        let prefix = this.currentCardNames[0].substring(0, this.currentQuery.query.length);
        for (let i = 0; i < this.maximumNumberOfMatches; ++i) {
            if (this.currentCardNames[i] != undefined) {
                let node = this.autocompleteDiv.childNodes[i];
                node.childNodes[0].textContent = prefix;
                node.childNodes[1].textContent = this.currentCardNames[i].substring(this.currentQuery.query.length);
            }
            else {
                let node = this.autocompleteDiv.childNodes[i];
                node.childNodes[0].textContent = "";
                node.childNodes[1].textContent = "";
            }
        }
    }

    updateSelectedAutocompleteIndex(newIndex: number): void {
        (<HTMLDivElement>this.autocompleteDiv.childNodes[this.selectedAutocompleteIndex]).classList.remove("active");
        this.selectedAutocompleteIndex = newIndex;
        (<HTMLDivElement>this.autocompleteDiv.childNodes[this.selectedAutocompleteIndex]).classList.add("active");
    }

    updateAutocompleteLocation() {
        // TODO: cache offsetTop if possible
        let coordinates = getCaretCoordinates(this.element, this.currentQuery.startIndex);
        this.autocompleteDiv.style.cssText = `top: ${this.element.offsetTop + coordinates.top + 20}px; left: ${this.element.offsetLeft + coordinates.left - 10}px;`
    }

    hideAutocomplete(): void {
        if (this.isVisible) {
            this.isVisible = false;
            this.autocompleteDiv.style.display = "none";
        }
    }

    getQuery(text: string, index: number): QueryResult {
        let startOfLine = text.lastIndexOf("\n", index - 1) + 1;
        let endOfLine = text.indexOf("\n", index);
        endOfLine = endOfLine == -1 ? text.length : endOfLine;
        let line = text.substring(startOfLine, endOfLine);
        let match = /^((?:\d+[Xx]?\s)?\s*)([^0-9]+)$/.exec(line);
        if (isNotDefined(match)) {
            return null;
        }
        let startOfWord = startOfLine + match[1].length;
        if (startOfWord > index) {
            return null;
        }
        return {
            query: match[2].toLowerCase(),
            startIndex: startOfWord,
            endIndex: endOfLine
        };
    }
}