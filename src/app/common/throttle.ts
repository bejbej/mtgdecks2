export class Throttle {
    private timeout: number;
    private invokeAgain: boolean = false;

    constructor(private duration: number, private func: Function) { }
    
    invoke() {
        if (this.timeout) {
            this.invokeAgain = true;
            return;
        }

        this.func();
        this.timeout = window.setTimeout(() => this.handleTimeout(), this.duration);
    }

    flush() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            this.handleTimeout();
        }
    }

    clear() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            delete this.timeout;
        }
    }

    private handleTimeout() {
        delete this.timeout;
        if (this.invokeAgain) {
            this.func();
            this.invokeAgain = false;
        }
    }
}