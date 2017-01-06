goog.provide('recoil.structs.table.CalcAddInfo');
goog.provide('recoil.structs.table.CalcAddInfos');
goog.provide('recoil.structs.table.CalcRemoveInfos');
goog.provide('recoil.structs.table.CalcRowFunc');
/**
 * an iterface that can transform tables, row by row
 */
goog.provide('recoil.structs.table.CalcTable');


goog.require('recoil.structs.table.Table');

/**
 * @typedef {!{key:!recoil.structs.table.ColumnKey,meta:Object,pk:boolean}}
 */
recoil.structs.table.CalcAddInfo;

/**
 * @typedef {Array<!recoil.structs.table.CalcAddInfo>}
 */
recoil.structs.table.CalcAddInfos;


/**
 * @typedef {Array<!recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.CalcRemoveInfos;

/**
 * @typedef {function(!recoil.structs.table.MutableTableRow)}
 */
recoil.structs.table.CalcRowFunc;


/**
 * @constructor
 */
recoil.structs.table.CalcTable = function() {
    /**
     * @private
     * @type {!Array<{added:!recoil.structs.table.CalcAddInfos,removed:!recoil.structs.table.CalcRemoveInfos,calc:!recoil.structs.table.CalcRowFunc, inv:!recoil.structs.table.CalcRowFunc}>}
     */
    this.calculators_ = [];
    this.meta_ = {};

};

/**
 * this will add meta to the table
 * @param {!Object} meta
 */
recoil.structs.table.CalcTable.prototype.addMeta = function(meta) {
    recoil.util.object.addProps(this.meta_, meta);
};

/**
 * @param {!recoil.structs.table.CalcAddInfos} addedColumns
 * @param {!recoil.structs.table.CalcRemoveInfos} removedColumns
 * @param {!recoil.structs.table.CalcRowFunc} calc
 * @param {!recoil.structs.table.CalcRowFunc=} opt_inverse
 */
recoil.structs.table.CalcTable.prototype.addRowCalc = function(addedColumns, removedColumns, calc, opt_inverse) {
    opt_inverse = opt_inverse || function(row) {};
    this.calculators_.push({added: addedColumns, removed: removedColumns, calc: calc, inv: opt_inverse});
};
/**
 * @template N,O
 * @param {!recoil.structs.table.ColumnKey<N>} newCol
 * @param {!recoil.structs.table.ColumnKey<O>} oldCol
 * @param {!function(O):N} calc
 * @param {!function(O):N=} opt_inverse
 */
recoil.structs.table.CalcTable.prototype.replaceCol = function(newCol, oldCol, calc, opt_inverse) {
    this.addRowCalc([{key: newCol}], [oldCol], this.valueToRowFunc_(oldCol, newCol, calc), this.valueToRowFunc_(newCol, oldCol, calc));
};
/**
 * @private
 * @template F,T
 * @param {!recoil.structs.table.ColumnKey<F>} fromCol
 * @param {!recoil.structs.table.ColumnKey<T>} toCol
 * @param {function(F):T} calc
 * @return {!function(!recoil.structs.table.MutableTableRow)}
 */
recoil.structs.table.CalcTable.prototype.valueToRowFunc_ = function(fromCol, toCol, calc) {
    return function(row) {
        if (calc) {
            row.set(calc(row.get(fromCol)));
        }
    };
};

/**
 * @private
 * @template F,T
 * @param {!recoil.structs.table.ColumnKey<F>} fromCol
 * @param {!recoil.structs.table.ColumnKey<T>} toCol
 * @param {function(recoil.structs.table.TableCell<F>):recoil.structs.table.TableCell<T>} calc
 * @return {!function(!recoil.structs.table.MutableTableRow)}
 */
recoil.structs.table.CalcTable.prototype.cellToRowFunc_ = function(fromCol, toCol, calc) {
    return function(row) {
        if (calc) {
            row.setCell(calc(row.getCell(fromCol)));
        }
    };
};
/**
 * @private
 * @param {!recoil.structs.table.Table} table
 * @return {!recoil.structs.table.MutableTable}
 */
recoil.structs.table.CalcTable.prototype.makeEmptyTable_ = function(table) {
    var toMap = function(keys) {
        var res = {};

        keys.forEach(function(c) {
            res[c] = c;
        });
        return res;
    };

    // work out the new columns
    var pks = table.getPrimaryColumns();
    var other = table.getOtherColumns();
    var pkMap = toMap(pks);
    var otherMap = toMap(other);
    var allPossible = pks.concat(other);
    this.calculators_.forEach(function(calc) {

        calc.removed.forEach(function(remove) {
            delete pkMap[remove];
            delete otherMap[remove];
        });
        calc.added.forEach(function(add) {
            allPossible.push(add.key);
            if (add.pk) {
                pkMap[add.key] = add.key;
            }
            else {
                otherMap[add.key] = add.key;
            }
        });
    });


    var seen = {};
    pks = allPossible.filter(function(col) {
        if (pkMap[col] === undefined || seen[col]) {
            return false;
        }
        seen[col] = true;
        return true;
    });

    other = allPossible.filter(function(col) {
        if (otherMap[col] === undefined || seen[col]) {
            return false;
        }
        seen[col] = true;
        return true;
    });


    var res = new recoil.structs.table.MutableTable(pks, other);
    res.setMeta(table.getMeta());

    // copy over column meta data
    table.getColumns().forEach(function(col) {
        if (otherMap[col] || pkMap[col]) {
            res.setColumnMeta(col, table.getColumnMeta(col));
        }
    });

    this.calculators_.forEach(function(calc) {

        calc.added.forEach(function(col) {
            if (col.meta && (otherMap[col.key] || pkMap[col.key])) {
                res.addColumnMeta(col.key, table.getColumnMeta(col.key));
            }
        });
    });
    return res;
};

/**
 * @param {!recoil.structs.table.Table} table
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.CalcTable.prototype.calculate = function(table) {
    var mtable = table.unfreeze();
    var res = this.makeEmptyTable_(table);
    var me = this;

    table.forEach(function(row, key, rowMeta) {
        var mutRow = new recoil.structs.table.MutableTableRow(undefined, row);
        me.calculators_.forEach(function(calc) {
            calc.calc(mutRow);
        });
        res.addRow(mutRow);
    });

    return res.freeze();

};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {!recoil.structs.table.Table} orig
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.CalcTable.prototype.inverse = function(table, orig) {
    var mtable = table.unfreeze();
    var res = orig.createEmpty();
    var me = this;

    table.forEach(function(row, key, rowMeta) {
        var mutRow = new recoil.structs.table.MutableTableRow(undefined, row);
        me.calculators_.forEach(function(calc) {
            calc.inv(mutRow);
        });
        res.addRow(mutRow);
    });

    return res.freeze();

};
