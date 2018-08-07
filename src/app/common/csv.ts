export class CSV {
    static parse = (csv: string, delimeter?: string): any[] => {
        delimeter = delimeter || ",";
        let lines = csv.split("\n");
        let keys = lines.shift().split(delimeter);
        return lines.reduce((array, line) => {
            if (line.trim().length === 0) {
                return array;
            }
            let values = line.split(delimeter);
            let item = {};
            for (let i = 0; i < keys.length; ++i) {
                item[keys[i]] = values[i];
            }
            array.push(item);
            return array;
        }, []);
    }

    static stringify = (items: any[], keys: string[], delimeter?: string): string => {
        delimeter = delimeter || ",";
        return items.reduce((csv, item) => {
            return csv + keys.map(key => item[key]).join(delimeter) + "\n";
        }, keys.join(delimeter) + "\n");
    }
}