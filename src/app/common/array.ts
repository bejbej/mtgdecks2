import { Dictionary, Func } from "@types";

export function contains<T>(source: T[], item: T): boolean {
    return source.indexOf(item) > -1;
}

export function except<T>(source: T[], array: T[]): T[] {
    let dictionary = array.reduce((dictionary, item) => {
        dictionary[item.toString()] = item;
        return dictionary;
    }, <Dictionary<T>>{});
    return source.filter(item => dictionary[item.toString()] === undefined);
}

export function selectMany<T>(array: T[][]): T[] {
    return [].concat.apply([], array);
}

export function distinct<T>(array: T[]): T[] {
    return Array.from(new Set<T>(array));
}

export function orderBy<T>(array: T[], valueSelector: Func<T, string>): T[] {
    return array.sort((a, b) => valueSelector(a) > valueSelector(b) ? 1 : -1);
}

export function sum<T>(array: T[], valueSelector?: Func<T, number>): number {
    return array.reduce((sum, item) => sum + valueSelector(item), 0);
}