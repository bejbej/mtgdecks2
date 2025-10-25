export type Func<T, TResult> = (arg: T) => TResult;
export type Dictionary<TKey extends string | number | symbol, TValue> = { [key in TKey]: TValue }