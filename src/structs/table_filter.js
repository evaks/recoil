goog.provide('recoil.structs.table.Filter');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table, filter : !function(!recoil.structs.table.TableRow):boolean},
 !{table:!recoil.structs.table.Table}>}>}
 * @constructor
 *
 */

recoil.structs.table.Filter = function() {
    this.srcCol_ = new recoil.structs.table.ColumnKey('$src', undefined, undefined,  /** @type {Array<?>}*/(null));
};

/**
 * @param {{table:!recoil.structs.table.Table, filter:!function(!recoil.structs.table.TableRow):boolean}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.Filter.prototype.calculate = function(params) {
    var me = this;
    var result = params.table.createEmpty([], [this.srcCol_]);
    params.table.forEach(function(row, key) {
        if (params.filter(row)) {
            result.addRow(row.set(me.srcCol_, key));
        }
    });
    return result.freeze();
};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {{table:!recoil.structs.table.Table, filter:!function(!recoil.structs.table.TableRow):boolean}} sources
 * @return {{table:!recoil.structs.table.Table}} params
 */
recoil.structs.table.Filter.prototype.inverse = function(table, sources) {
    var result = sources.table.createEmpty();

    var replaceMap = new goog.structs.AvlTree(recoil.util.object.compareKey);

    var rightRes = sources.table.createEmpty();
    var me = this;

    table.forEach(function(row) {
        replaceMap.add({key: row.get(me.srcCol_), row: row});
    });

    sources.table.forEach(function(row, key) {
        if (sources.filter(row)) {
            var newRow = replaceMap.findFirst({key: key});
            if (newRow) {
                result.addRow(newRow.row);
                replaceMap.remove(newRow);
            }
        }
        else {
            result.addRow(row);
        }
    });
    replaceMap.inOrderTraverse(function(node) {
        result.addRow(node.row);
    });
    return {table: result.freeze()};
};
