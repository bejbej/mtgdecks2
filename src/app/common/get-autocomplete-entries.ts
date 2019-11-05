export function getAutocompleteEntries<T>(items: T[], query: string, selector: Func<T, string>, maximumNumberOfMatches: number) {
    let i = findAlphabeticalIndex(items, query, selector);
    let array: T[] = [];
    let max = Math.min(i + maximumNumberOfMatches, items.length);

    for (let j = i; j < max; ++j) {
        if (!selector(items[j]).startsWith(query)) {
            break;
        }
        array.push(items[j]);
    }

    return array;
}

function findAlphabeticalIndex<T>(items: T[], item: string, selector: Func<T, string>): number {
    let min = -1;
    let max = items.length;
    let i: number;
    while (true) {
        if (min == max || max == 0) {
            return max;
        }
        i = Math.floor((max - min) / 2) + min;
        if (item > selector(items[i])) {
            min = i + 1;
        }
        else {
            max = i;
        }
    }
}