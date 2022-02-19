import { Dictionary, Func } from "@types";

export function except<T>(source: T[], array: T[]): T[] {
    let dictionary = array.reduce((dictionary, item) => {
        dictionary[item.toString()] = item;
        return dictionary;
    },<Dictionary<T>>{});
    return source.filter(item => dictionary[item.toString()] === undefined);
}

export function selectMany<T>(array: T[][]): T[] {
    return [].concat.apply([], array);
}

export function distinct(array: string[]): string[] {
    let dictionary = array.reduce((dictionary, array) => {
        dictionary[array] = array;
        return dictionary;
    }, {});
    return Object.keys(dictionary);
}       

export function orderBy<T>(array: T[], valueSelector: Func<T, string>): T[] {
    return array.sort((a, b) => valueSelector(a) > valueSelector(b) ? 1 : -1);
}
