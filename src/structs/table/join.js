goog.provide('recoil.structs.table.Join');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table},
 !{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table}>}
 * @constructor
 * @param {!function (!recoil.structs.table.TableRow) : ?} keyGetter1 gets the join key out of the
 *             left table
 * @param {!function (!recoil.structs.table.TableRow) : ?} keyGetter2 gets the join key out of the
 *             right table
 * @param {Array<!recoil.structs.table.ColumnKey>=} opt_table2Pks extra primay keys from right table
               this is nessecary the right table can result in more than 1 row for each left table row
 * @param {recoil.structs.table.TableRow=} opt_defaultRow a row containing the default values if right row
 *             does not exist, if this is supplied then it is assumed this is an outer join
 * @param {boolean=} opt_outer is this an outer join
 *
 * notes on outer joins:
 * when doing an inversable outer join you should be careful that you do not set all the right columns to
 * match the default row (all nulls if none specified) since this will delete the right row from the output
 * table, but only if the keys still match the left table
 *
 */

recoil.structs.table.Join = function(keyGetter1,  keyGetter2, opt_table2Pks, opt_defaultRow, opt_outer) {
    this.keyGetter1_ = keyGetter1;
    this.keyGetter2_ = keyGetter2;
    this.table2Pks_ = opt_table2Pks || [];
    this.defaultRow_ = opt_defaultRow;
    this.outer_ = opt_defaultRow ? true : opt_outer;
};
/**
 * @private
 * @param {!recoil.structs.table.Table} table
 * @param {!function (!recoil.structs.table.TableRow) : !Object} keyGetter
 * @return {goog.structs.AvlTree}
 */
recoil.structs.table.Join.makeMap_ = function(table, keyGetter) {
    var rightMap = new goog.structs.AvlTree(recoil.util.object.compareKey);
    table.forEach(function(row) {
       var key = keyGetter(row);
       var existing = rightMap.findFirst({key: key});
       if (existing) {
           existing.rows.push(row);
       }
       else {
           rightMap.add({key: key, rows: [row]});
       }
    });
    return rightMap;
};

/**
 * @param {{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table}} tables
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.Join.prototype.calculate = function(tables) {
    var me = this;
    var rightMap = recoil.structs.table.Join.makeMap_(tables.right, me.keyGetter2_);

    var src = [];
    var pks = tables.left.getPrimaryColumns().concat(this.table2Pks_);
    var otherColumns = tables.left.getColumns()
            .filter(function(value) {
                return pks.indexOf(value) < 0;
            });
    var seen = {};
    tables.left.getColumns().forEach(function (col) {
        seen[col] = true;
    });
    tables.right.getColumns().forEach(function (col) {
        if (pks.indexOf(col) < 0) {
            if (!seen[col]) {
                otherColumns.push(col);
                seen[col] = true;
            }
        }
    });

    var result = new recoil.structs.table.MutableTable(pks, otherColumns);

    result.setMeta(tables.left.getMeta());
    result.addMeta(tables.right.getMeta());
    tables.left.getColumns().forEach(function(col) {
        result.setColumnMeta(col, tables.left.getColumnMeta(col));
    });

    tables.right.getColumns().forEach(function(col) {
        result.addColumnMeta(col, tables.right.getColumnMeta(col));
    });
    tables.left.forEach(function(row) {
        var key = me.keyGetter1_(row);
        var otherRows = rightMap.findFirst({key: key});

        if (otherRows || me.outer_) {
            otherRows = otherRows ? otherRows.rows : [null];
            otherRows.forEach(function(otherRow) {
                var curRow = new recoil.structs.table.MutableTableRow(undefined, row);
                otherRow = otherRow ? otherRow : me.defaultRow_;
                if (otherRow) {
                    curRow.addRowMeta(otherRow.getRowMeta());
                }
                tables.right.getColumns().forEach(function(col) {
                    var val = otherRow ? otherRow.getCell(col) : null;
                    curRow.setCell(col, otherRow.getCell(col));
                });
                result.addRow(curRow);
            });
        }
        else {
            return;
        }
    });

    return result.freeze();
};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {!{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table}} sources
 * @return {!{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table}} objects to set
 */
recoil.structs.table.Join.prototype.inverse = function(table, sources) {
    var leftRes = sources.left.createEmpty();
    var rightRes = sources.right.createEmpty();
    var me = this;



    var rightMap = recoil.structs.table.Join.makeMap_(sources.right, me.keyGetter2_);
    var leftMap = recoil.structs.table.Join.makeMap_(sources.left, me.keyGetter1_);
    // add items in left and right that are not in the other table
    [{tbl: sources.left, dest: leftRes, map: rightMap, getter: me.keyGetter1_},
     {tbl: sources.right, dest: rightRes, map: leftMap, getter: me.keyGetter2_}].forEach(
         function(info) {
             info.tbl.forEach(function(row) {
                 if (!info.map.findFirst({key: info.getter(row)})) {
                     info.dest.addRow(row);
                 }
             });
         }
     );

    table.forEach(function(row) {
        var leftRow = new recoil.structs.table.MutableTableRow();
        var rightRow = new recoil.structs.table.MutableTableRow();

        leftRes.getColumns().forEach(function(col) {
            var cell = row.getCell(col);
            if (cell) {
                leftRow.setCell(col, cell);
            }
        });
        var existing = leftRes.getRow(leftRes.getRowKey(leftRow));
        if (!existing) {
            leftRes.addRow(leftRow);
        }
        else if (!recoil.util.object.isEqual(existing, leftRow.freeze())) {
            console.error('dup', existing, leftRow.freeze());
            throw new Error('duplicate rows must be the same');
        }

        var matchesDefault = me.outer_;

        rightRes.getColumns().forEach(function(col) {
            var cell = row.getCell(col);
            if (cell) {
                rightRow.setCell(col, cell);
                var val = cell.getValue();
                var defVal = me.defaultRow_ ? me.defaultRow_.get(col) : null;
                if (!recoil.util.object.isEqual(val, defVal)) {
                    matchesDefault = false;
                }
            }
        });

        // if the default key matches and the keys don't match
        if (matchesDefault &&
            recoil.util.object.compare(
                me.keyGetter1_(leftRow.freeze()), me.keyGetter2_(rightRow.freeze())) !== 0) {
            return;
        }

        existing = rightRes.getRow(rightRes.getRowKey(rightRow));
        if (!existing) {
            rightRes.addRow(rightRow);
        }
        else if (!recoil.util.object.isEqual(existing, rightRow.freeze())) {
            console.error('dup', existing, rightRow.freeze());
            throw new Error('duplicate rows must be the same');
        }
    });

    return {left: leftRes.freeze(), right: rightRes.freeze()};
};


recoil.structs.table.Join.createKeyJoin = function (table1B, table2B, key1, opt_key2) {
    var keyGetter1 = function (row) {
        return row.get(key1);
    }
    var keyGetter2 = function (row) {
        return row.get(opt_key2 || key1);
    }
    var join = new recoil.structs.table.Join(keyGetter1,  keyGetter2);   

    return recoil.frp.Inversable.create(table1B.frp(), join,{left: table1B, right: table2B});
}