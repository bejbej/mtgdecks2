export function findCommonPrefixLength(array: string[], ignoreCase: boolean): number {
    if (array.length == 1) {
        return array[0].length;
    }

    array = array.concat();
    let referenceItem = array.pop();
    let i = 0;
    for (;i < referenceItem.length; ++i) {
        if (ignoreCase !== true && !array.every(item => item[i] == referenceItem[i])) {
            break;
        }
        else if (ignoreCase === true && !array.every(item => item[i] !== undefined && item[i].toLowerCase() == referenceItem[i].toLowerCase())) {
            break;
        }
    }
    return i;
}