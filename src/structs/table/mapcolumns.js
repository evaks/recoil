goog.provide('recoil.structs.table.MapColumns');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * allows columns to be renamed, it is useful to take one table
 * and make it look like another
 *
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table, mappings : !Array<{from : !recoil.structs.table.ColumnKey, to: !recoil.structs.table.ColumnKey}>},
 !{table:!recoil.structs.table.Table}>}>}
 * @constructor
 *
 */

recoil.structs.table.MapColumns = function() {
};

/**
 * @param {{table:!recoil.structs.table.Table, mappings:!Array<{from : !recoil.structs.table.ColumnKey, to: !recoil.structs.table.ColumnKey}>}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.MapColumns.prototype.calculate = function(params) {
    var me = this;
    var toMap = {};
    params.mappings.forEach(function(mapping) {
        toMap[mapping.from] = mapping.to;
    });


    var toPks = [];
    var toOthers = [];

    params.table.getPrimaryColumns().forEach(function(col) {
        var newCol = toMap[col];
        toPks.push(newCol ? newCol : col);
    });

    params.table.getOtherColumns().forEach(function(col) {
        var newCol = toMap[col];
        toOthers.push(newCol ? newCol : col);
    });

    var columns = params.table.getColumns();

    var result = new recoil.structs.table.MutableTable(toPks, toOthers);

    result.setMeta(params.table.getMeta());
    params.table.getColumns().forEach(function(col) {
        var newCol = toMap[col] ? toMap[col] : col;
        result.setColumnMeta(newCol, params.table.getColumnMeta(col));
    });

    params.table.forEach(function(row, key) {
        // the unused columns should just be removed automatically
        var newRow = new recoil.structs.table.MutableTableRow(undefined, row);

        params.mappings.forEach(function(mapping) {
            var cell = row.getCell(mapping.from);
            if (cell) {
                newRow.setCell(mapping.to, cell);
            }
        });

        result.addRow(newRow);
    });
    return result.freeze();
};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {{table:!recoil.structs.table.Table,
 mappings : !Array<{from : !recoil.structs.table.ColumnKey, to: !recoil.structs.table.ColumnKey}>}} sources
 * @return {{table:!recoil.structs.table.Table}} params
 */
recoil.structs.table.MapColumns.prototype.inverse = function(table, sources) {
    var result = sources.table.createEmpty();
    var fromMap = {};
    sources.mappings.forEach(function(mapping) {
        fromMap[mapping.to] = mapping.from;
    });


    result.setMeta(table.getMeta());
    table.getColumns().forEach(function(col) {
        var newCol = fromMap[col] ? fromMap[col] : col;
        result.setColumnMeta(newCol, table.getColumnMeta(col));
    });


    table.forEach(function(row) {

        var newRow = new recoil.structs.table.MutableTableRow(undefined, row);

        sources.mappings.forEach(function(mapping) {
            var cell = row.getCell(mapping.to);
            if (cell) {
                newRow.setCell(mapping.from, cell);
            }
        });


        result.addRow(newRow);
    });

    return {table: result.freeze()};
};
