interface SplitResults {
    groupSizes: number[];
    largestSize: number;
}

export class GroupEvenly {

    static exec = <T>(array: T[], numberOfGroups: number, groupSizeFunc: (T) => number): T[][] => {
        if (array.length === 0) {
            return [];
        }

        var words = array.map<number>(<any>groupSizeFunc);
        var referenceArray = GroupEvenly.generateReferenceArray(words);

        var currentGroupSizes = [words.length];
        var currentLargestSize = words.reduce((a, b) => {
            return a + b;
        }, 0);

        while (true) {
            var results = GroupEvenly.split(referenceArray, currentLargestSize - 1);
            if (results === undefined) {
                break;
            }
            if (results.groupSizes.length > numberOfGroups) {
                break;
            } else {
                currentGroupSizes = results.groupSizes;
                currentLargestSize = results.largestSize;
            }
        }

        var start = 0;
        var groups = currentGroupSizes.map(groupSize => {
            var group = array.slice(start, start + groupSize);
            start = start + groupSize;
            return group;
        });

        var additionalEmptyGroups = numberOfGroups - groups.length;
        for (var i = 0; i < additionalEmptyGroups; ++i) {
            groups.push([]);
        }

        return groups;
    }

    private static generateReferenceArray = (array): number[][] => {
        var out = [];
        for (var i = 0; i < array.length; ++i) {
            var accumulator = 0;
            var row = [];
            out.push(row);
            for (var j = i; j < array.length; ++j) {
                accumulator = accumulator + array[j];
                row.push(accumulator);
            }
        }
        return out;
    }

    private static split = (referenceArray: number[][], size): SplitResults => {
        var groupSizes = [];
        var largestSize = 0;
        for (var i = 0; i < referenceArray.length;) {
            var currentRow = referenceArray[i];
            if (currentRow[0] > size) {
                return undefined;
            }
            for (var j = 0; j < currentRow.length - 1; ++j) {
                if (currentRow[j + 1] > size) {
                    break;
                }
            }
            largestSize = currentRow[j] > largestSize ? currentRow[j] : largestSize;
            groupSizes.push(j + 1);
            i = i + j + 1;

        }
        return { groupSizes: groupSizes, largestSize: largestSize };
    }
}