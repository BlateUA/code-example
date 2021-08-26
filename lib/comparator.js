const _ = require('lodash');
const required = () => {
    throw new Error('Field must be defined');
};

module.exports = class Comparator {
    constructor({
                    sourceItemsA = [],
                    sourceItemsB = [],
                    pkA = required(),
                    pkB = required(),
                    comparisonMap = required()
                }) {
        this.pkA = pkA;
        this.pkB = pkB;
        this.sourceItemsA = sourceItemsA.reduce((acc, item) => {
            acc[item[this.pkA]] = item;
            return acc;
        }, {});
        this.sourceItemsB = sourceItemsB.reduce((acc, item) => {
            acc[item[this.pkB]] = item;
            return acc;
        }, {});
        this.comparisonMap = comparisonMap;
    }

    compareItem(itemA, itemB) {
        let result = {
            itemA: {},
            itemB: {},
            equal: true
        };
        for (const [keyA, keyB] of Object.entries(this.comparisonMap)) {
            const fieldA = _.get(itemA, keyA);
            const fieldB = _.get(itemB, keyB);
            if (!(!fieldA && !fieldB) && this.escapeEdgeCases(fieldA) !== this.escapeEdgeCases(fieldB)) {
                result.equal = false;
                result.itemA[keyA] = fieldA;
                result.itemA['listing_id'] = itemA['listing_id'];
                result.itemA['ignite_client_key'] = itemA['ignite_client_key'];
                result.itemB[keyB] = fieldB;
                result.itemB[this.pkB] = itemB[this.pkB];
            }
        }
        return result;
    }

    escapeEdgeCases(string = '') {
        return string.replace(/’/g, `'`)
    }

    compare() {
        const comparison = {
            equal: [],
            differences: [],
            notMatched: []
        };

        for (const [pk, itemA] of Object.entries(this.sourceItemsA)) {
            const itemB = this.sourceItemsB[pk];

            if (itemB) {
                const result = this.compareItem(itemA, itemB);

                if (result.equal) {
                    comparison.equal.push(pk);
                } else {
                    comparison.differences.push(result);
                }
            } else {
                comparison.notMatched.push(pk);
            }
        }

        return comparison;
    }
}