import { Dictionary, Func } from "@types";

export interface ToDictionaryOptions<TSource, TKey, TValue> {
    source: TSource[];
    keyFunc: Func<TSource, TKey>;
    valueFunc: Func<TSource, TValue>;
}

export function toDictionary<TSource, TKey extends string | number | symbol, TValue>(options: ToDictionaryOptions<TSource, TKey, TValue>): Dictionary<TKey, TValue> {
    const dictionary = {} as Dictionary<TKey, TValue>;
    for (let item of options.source) {
        dictionary[options.keyFunc(item)] = options.valueFunc(item);
    }
    return dictionary;
}
