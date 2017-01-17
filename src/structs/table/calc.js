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
 * @typedef {function(!recoil.structs.table.Table,!recoil.structs.table.MutableTable)}
 */
recoil.structs.table.CalcColMetaFunc;


/**
 * @typedef {recoil.structs.table.CalcColMetaFunc|Object}
 */
recoil.structs.table.CalcColMeta;


/**
 * @constructor
 */
recoil.structs.table.CalcTable = function() {
    /**
     * @private
     * @type {!Array<{added:!recoil.structs.table.CalcAddInfos,removed:!recoil.structs.table.CalcRemoveInfos,calc:!recoil.structs.table.CalcRowFunc,inv:!recoil.structs.table.CalcRowFunc,colMeta:function(!recoil.structs.table.Table,recoil.structs.table.MutableTable)}>}
     */
    this.calculators_ = [];
    this.meta_ = {};
    this.origCol_ = new recoil.structs.table.ColumnKey('$orig', undefined, undefined, /** @type {recoil.structs.table.TableRow} */ (null));
    this.origOutCol_ = new recoil.structs.table.ColumnKey('$orig-out', undefined, undefined, /** @type {recoil.structs.table.TableRow} */ (null));

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
 * @param {!recoil.structs.table.CalcColMetaFunc=} opt_colMeta
 */
recoil.structs.table.CalcTable.prototype.addRowCalc = function(addedColumns, removedColumns, calc, opt_inverse, opt_colMeta) {
    opt_inverse = opt_inverse || function(row) {};
    opt_colMeta = opt_colMeta || function(fromTable, toTable) {};
    this.calculators_.push({added: addedColumns, removed: removedColumns, calc: calc, inv: opt_inverse, colMeta: opt_colMeta});
};
/**
 * @template N,O
 * @param {!recoil.structs.table.ColumnKey<N>} newCol
 * @param {!recoil.structs.table.ColumnKey<O>} oldCol
 * @param {!function(O):N} calc
 * @param {!function(O):N=} opt_inverse
 * @param {!recoil.structs.table.CalcColMeta=} opt_colMeta
 */
recoil.structs.table.CalcTable.prototype.replaceCol = function(newCol, oldCol, calc, opt_inverse, opt_colMeta) {
    this.addRowCalc([{key: newCol}], [oldCol], this.valueToRowFunc_(oldCol, newCol, calc), this.valueToRowFunc_(newCol, oldCol, calc), this.colMetaFunc_(newCol, opt_colMeta));
};

/**
 * @template N,O
 * @param {!recoil.structs.table.ColumnKey<N>} newCol
 * @param {!recoil.structs.table.ColumnKey<O>} oldCol
 * @param {!function(O):N} calc
 * @param {!function(O):N=} opt_inverse
 * @param {!recoil.structs.table.CalcColMeta=} opt_colMeta
 */
recoil.structs.table.CalcTable.prototype.addCol = function(newCol, oldCol, calc, opt_inverse, opt_colMeta) {
    this.addRowCalc([{key: newCol}], [], this.valueToRowFunc_(oldCol, newCol, calc), this.valueToRowFunc_(newCol, oldCol, calc), this.colMetaFunc_(newCol, opt_colMeta));
};


/**
 * @param {!recoil.structs.table.ColumnKey} col
 */
recoil.structs.table.CalcTable.prototype.removeCol = function(col) {
    this.addRowCalc([], [col], function() {}, function() {});
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
            row.set(toCol, calc(row.get(fromCol)));
        }
    };
};

/**
 * @private
 * @param {!recoil.structs.table.ColumnKey} col
 * @param {recoil.structs.table.CalcColMeta=} meta
 * @return {!recoil.structs.table.CalcColMetaFunc}
 */
recoil.structs.table.CalcTable.prototype.colMetaFunc_ = function(col, meta) {
    if (goog.isFunction(meta)) {
        return meta;
    }

    return function(from, to) {
        if (meta) {
            to.addColumnMeta(col, meta);
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
    }).concat([this.origCol_, this.origOutCol_]);


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
    // TODO allow calculation col meta data
    me.calculators_.forEach(function(calc) {
        calc.colMeta(table, res);
    });

    table.forEach(function(row, key, rowMeta) {
        var mutRow = new recoil.structs.table.MutableTableRow(undefined, row);
        me.calculators_.forEach(function(calc) {
            calc.calc(mutRow);
        });
        mutRow.set(me.origOutCol_, mutRow.freeze());
        mutRow.set(me.origCol_, row);
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
        var origRow = row.get(me.origCol_);
        var origOutRow = row.get(me.origOutCol_);
        var mutRow = new recoil.structs.table.MutableTableRow(undefined, row);

        // put cell don't exist in new but do exist original
        orig.getColumns().forEach(function(col) {
            var newCell = mutRow.getCell(col);
            if (!newCell) {
                var oldCell = origRow.getCell(col);
                if (oldCell) {
                    mutRow.setCell(col, oldCell);
                }
            }
        });


        me.calculators_.forEach(function(calc) {
            // check an output of this calculator has changed
            var changed = false;
            for (var i = 0; i < calc.added.length && !changed; i++) {
                var col = calc.added[i].key;
                var orig = origRow ? origOutRow.getCell(col) : null;
                var cur = row.getCell(col);

                if (cur &&
                    (!orig ||
                     !recoil.util.object.isEqual(orig.getValue(), cur.getValue()))) {
                    changed = true;
                }
            }
            if (changed) {
                console.log('found changed', key, calc);
                calc.inv(mutRow);
            }
            else {
                console.log('found unchanged', key, calc);
            }
        });
        res.addRow(mutRow);
    });

    return res.freeze();

};
