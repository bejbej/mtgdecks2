export function hasLength(item: { length: number } | null | undefined): boolean {
    return isDefined(item) && item.length > 0;
}

export function hasNoLength(item: { length: number } | null | undefined): boolean {
    return isNotDefined(item) || item.length === 0;
}

export function isDefined<T>(item: T | null | undefined): item is T {
    return item !== null && item !== undefined;
}

export function isNotDefined<T>(item: T | null | undefined): item is null | undefined {
    return item === null || item === undefined;
}