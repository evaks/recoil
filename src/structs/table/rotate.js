goog.provide('recoil.structs.table.Rotate');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * this rotates the table so that the column are rows and th rows are columns
 * it is best that all meta data is applied before rotation, so that the Correct Meta data and name
 * for the row can be applied
 *
 * The first column will be considered column header
 *
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table},
 !{table:!recoil.structs.table.Table}>}>}
 * @constructor
 */

recoil.structs.table.Rotate = function() {
    /**
     * @private
     * @type {!recoil.structs.table.ColumnKey<!recoil.structs.table.ColumnKey>}
     */
    this.primaryKey_ = new recoil.structs.table.ColumnKey('$key');
    /**
     * @private
     * @type {!recoil.structs.table.ColumnKey<!Array<{srcPk:!Array,destCol:!recoil.structs.table.ColumnKey}>>}
     */
    this.colMapKey_ = new recoil.structs.table.ColumnKey('$colmap');
    this.nameKey_ = new recoil.structs.table.ColumnKey('$name');
    this.cachedColKeys_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
};

/**
 * @param {{table:!recoil.structs.table.Table}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.Rotate.prototype.calculate = function(params) {
    var me = this;
    var table = params.table;


    // work out what columns we will need
    var otherCols = [this.nameKey_];
    var newCached = new goog.structs.AvlTree(recoil.util.object.compareKey);

    table.forEach(function(row, pk) {
        var cached = me.cachedColKeys_.findFirst({key: pk});
        if (!cached) {
            cached = {key: pk, col: new recoil.structs.table.ColumnKey('' + pk)};
        }
        cached.row = row;
        newCached.add(cached);
    });
    me.cachedColKeys_ = newCached;

    var result = new recoil.structs.table.MutableTable([this.primaryKey_], otherCols);
    result.setMeta(table.getMeta());
    // setup the column meta, for the first column it will be like a header renderer
    result.setColumnMeta(this.nameKey_, {name: '', position: 0, cellDecorator: recoil.ui.widgets.table.TableWidget.defaultHeaderDecorator});

    // for the other column we will set the row meta data on it, and add the column name

    var colPos = 1;
    table.forEach(function(row, pk) {
        var cached = me.cachedColKeys_.findFirst({key: pk});
        var first = true;
        table.forEachPlacedColumn(function(col, meta) {
            if (first) {
                result.setColumnMeta(cached.col, {name: row.get(col), position: colPos++});
                result.addColumnMeta(cached.col, row.getMeta());
                result.addColumnMeta(cached.col, row.getCell(col).getMeta());
            }
            first = false;
        });
    });


    var pos = 0;
    // now add the data to the table
    table.forEachPlacedColumn(function(col, meta) {
        var newRow = new recoil.structs.table.MutableTableRow(pos);
        newRow.set(me.primaryKey_, col);

        newRow.set(me.nameKey_, table.getColumnMeta(col).name);
        newRow.setCellMeta(me.nameKey_, table.getColumnMeta(col));
        var colMappings = [];

        table.forEach(function(row, pk) {
            var cached = me.cachedColKeys_.findFirst({key: pk});

            newRow.set(cached.col, {name: row.get(col)});
            newRow.setCellMeta(cached.col, meta);
            newRow.addCellMeta(cached.col, row.getCell(col).getMeta());
            colMappings.push({srcPk: pk, destCol: cached.col});

        });
        newRow.set(me.colMapKey_, colMappings);
        result.addRow(newRow);
        pos++;
    });

    return result.freeze();
};

/**
 * for now we do not handl adding new rows, that would be like adding a new
 * column, or adding new columns
 *
 * @param {!recoil.structs.table.Table} table
 * @param {!{table:!recoil.structs.table.Table}} sources
 * @return {!{table:!recoil.structs.table.Table}}
 */
recoil.structs.table.Rotate.prototype.inverse = function(table, sources) {
    var dest = sources.table.unfreeze();
    var me = this;

    table.forEach(function(row) {
        var destCol = row.get(me.primaryKey_);
        var rowMappings = row.get(me.colMapKey_);
        rowMappings.forEach(function(mapping) {
            dest.set(mapping.srcPk, destCol, row.get(mapping.destCol));
        });

    });
    return {table: dest.freeze()};
};

