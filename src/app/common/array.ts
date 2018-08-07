interface Array<T> {
    except(array: Array<T>): Array<T>;
}

if (!Array.prototype.except) {
    Array.prototype.except = function(array) {
        return this.filter(element => array.indexOf(element) === -1);
    }
}