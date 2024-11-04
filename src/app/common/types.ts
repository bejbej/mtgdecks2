export type Func<T, TResult> = (arg: T) => TResult;
export type Dictionary<T> = { [key in string | number]: T };