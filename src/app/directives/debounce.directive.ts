import { Directive, ElementRef, EventEmitter, forwardRef, Input, NgZone, OnChanges, OnInit, Output } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export const DEFAULT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DebounceDirective),
    multi: true
};

@Directive({
    selector: 'input[debounce],textarea[debounce]',
    providers: [DEFAULT_VALUE_ACCESSOR]
})
export class DebounceDirective implements ControlValueAccessor, OnChanges, OnInit {

    @Input() debounce: number;
    @Input() value: any;
    @Output() valueChange: EventEmitter<any> = new EventEmitter<any>();
    isDirty: boolean = false;
    onChange: any;
    onTouched: any;
    previousValue: any;
    timeout: number;

    constructor(private element: ElementRef, private ngZone: NgZone) { }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            this.element.nativeElement.addEventListener("input", () => this.delay());
            this.element.nativeElement.addEventListener("blur", () => this.flush());
        });
    }

    ngOnChanges() {
        this.previousValue = this.value;
        this.element.nativeElement.value = this.value;
        this.clearTimeout();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(value: any): void {
        this.element.nativeElement.value = value;
        this.previousValue = value;
        this.clearTimeout();
    }

    private clearTimeout = () => {
        clearTimeout(this.timeout);
        delete this.timeout;
    }

    private delay = () => {
        this.isDirty = true;
        this.clearTimeout();
        this.timeout = window.setTimeout(() => {
            delete this.timeout;
            this.updateValue();
        }, this.debounce || 0);
    }

    private flush = () => {
        this.clearTimeout();
        this.updateValue();
    }

    private updateValue = () => {
        if (!this.isDirty) {
            return;
        }
        this.isDirty = false;
        let previousValue = this.previousValue;
        let value = this.element.nativeElement.value;
        if (previousValue === value) {
            return;
        }
        this.previousValue = value;
        this.ngZone.run(() => {
            if (this.onChange) {
                this.onChange(value);
            }

            this.valueChange.emit(value);
        });
    }
}
