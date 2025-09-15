export function hasLength(item: { length: number } | null | undefined): boolean {
    return item && item.length > 0;
}