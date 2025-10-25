import { Func } from "@types";

export function except<T>(source: T[], array: T[]): T[] {
    const sourceSet = new Set(source);
    const exceptSet = new Set(array);
    return [...sourceSet.difference(exceptSet)];
}

export function distinct<T>(array: T[]): T[] {
    return Array.from(new Set<T>(array));
}

export function orderBy<T>(array: T[], valueSelector: Func<T, string>): T[] {
    return array.toSorted((a, b) => valueSelector(a) > valueSelector(b) ? 1 : -1);
}

export function sum<T>(array: T[], valueSelector?: Func<T, number>): number {
    return array.reduce((sum, item) => sum + valueSelector(item), 0);
}