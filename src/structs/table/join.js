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
 * @param {!function (!recoil.structs.table.TableRow) : !Object} keyGetter1 gets the join key out of the
 *             left table
 * @param {!function (!recoil.structs.table.TableRow) : !Object} keyGetter2 gets the join key out of the
 *             right table
 * @param {Array<!recoil.structs.table.ColumnKey>} opt_table2Pks extra primay keys from right table
               this is nessecary the right table can result in more than 1 row for each left table row
 * @param {recoil.structs.table.TableRow=} opt_defaultRow a row containing the default values if right row
 *             does not exist, if this is supplied then it is assumed this is an outer join
 * @param {boolean=} opt_outer is this an outer join
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
 * @param {{left:!recoil.structs.table.Table, right:!recoil.structs.table.Table}} tables
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.Join.prototype.calculate = function(tables) {
    var me = this;
    var rightMap = new goog.structs.AvlTree(recoil.util.object.compareKey);
    tables.right.forEach(function(row) {
       var key = me.keyGetter2_(row);
       var existing = rightMap.findFirst({key: key});
       if (existing) {
           existing.rows.push(row);
       }
       else {
           rightMap.add({key: key, rows: [row]});
       }
   });

    var src = [];
    var pks = tables.left.getPrimaryColumns().concat(this.table2Pks_);
    var otherColumns = tables.left.getColumns()
            .concat(tables.right.getColumns())
            .filter(function(value) {
                return pks.indexOf(value) < 0;
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
            throw 'duplicate rows must be the same';
        }

        rightRes.getColumns().forEach(function(col) {
            var cell = row.getCell(col);
            if (cell) {
                rightRow.setCell(col, cell);
            }
        });
        existing = rightRes.getRow(rightRes.getRowKey(rightRow));
        if (!existing) {
            rightRes.addRow(rightRow);
        }
        else if (!recoil.util.object.isEqual(existing, rightRow.freeze())) {
            console.error('dup', existing, rightRow.freeze());
            throw 'duplicate rows must be the same';
        }
    });

    return {left: leftRes.freeze(), right: rightRes.freeze()};
};
