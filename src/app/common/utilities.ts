export function hasLength(item: { length: number } | null | undefined): boolean {
    return item && item.length > 0;
}

export function hasNoLength(item: { length: number } | null | undefined): boolean {
    return !item || item.length === 0;
}

export function isDefined(x: any): boolean {
    return x !== null && x !== undefined;
}

export function isNotDefined(x: any): boolean {
    return x === null || x === undefined;
}