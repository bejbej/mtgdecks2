import { Dictionary, Func } from "@types";

export function toDictionary<T>(array: T[], keyFunc: Func<T, string>): Dictionary<T> {
    return array.reduce((dictionary, item) => {
        dictionary[keyFunc(item)] = item;
        return dictionary;
    }, <Dictionary<T>>{});
}

export function toDictionary2<Tin, Tout>(array: Tin[], keyFunc: Func<Tin, string | number>, valueFunc: Func<Tin, Tout>): Dictionary<Tout> {
    return array.reduce((dictionary, item) => {
        dictionary[keyFunc(item)] = valueFunc(item);
        return dictionary;
    }, <Dictionary<Tout>>{});
}

export function toArray<T>(dictionary: Dictionary<T>): T[] {
    return Object.keys(dictionary).map(key => dictionary[key]);
}
