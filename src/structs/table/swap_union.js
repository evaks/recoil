goog.provide('recoil.structs.table.SwapUnion');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * does a sql union on 2 tables, this is like union the source table can change depending on the 
 * what data in the table is.
 *
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table},
 !{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}>}>}
 * @constructor
 * @param {!function(!recoil.structs.table.TableRow):number} srcFunc function to determine which src the row should be written out to
 * @param {!recoil.structs.table.ColumnKey<!number>=} opt_pkCol column for the new Primary Key if not provided will generate one
 */

recoil.structs.table.SwapUnion = function(srcFunc, opt_pkCol) {
    this.primaryKey_ = opt_pkCol || new recoil.structs.table.ColumnKey('$id');
    this.srcFunc_ = srcFunc;
};
/**
 * @private
 * @param {!recoil.structs.table.Table} table
 * @param {!recoil.structs.table.TableRow} row
 * @return {!Array<?>} every value in the row
 */
recoil.structs.table.SwapUnion.prototype.getRowValues_ = function(table, row) {
    var rowValues = [];
    table.getColumns().forEach(function(col) {
        rowValues.push(row.get(col));
    });
    return rowValues;
};
/**
 * @param {{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.SwapUnion.prototype.calculate = function(params) {
    var me = this;
    var tables = [params.table1, params.table2];

    var srcPks = params.table1.getPrimaryColumns();
    
    var pks = this.primaryKey_ ? [this.primaryKey_] : tables[0].getPrimaryColumns();
    var other = srcPks.concat(tables[0].getOtherColumns());
    var result = new recoil.structs.table.MutableTable([this.primaryKey_],other);
    var seen = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var removeDups = this.uniq_;
    var pos = 0;

    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        var pkConcat = this.concatPk_ ? this.concatPk_[i] : null;
        result.addMeta(table.getMeta());
        table.getColumns().forEach(function(col) {
            result.addColumnMeta(col, table.getColumnMeta(col));
        });
        
        table.forEach(function(row, keys) {
            
            var newRow = row.unfreeze();
            newRow.setCell(me.srcCol_, new recoil.structs.table.TableCell(keys.concat([i])));
            newRow.setPos(pos);
            result.addRow(newRow);
            pos++;
        });
    }
    return result.freeze();
};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {!{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}} sources
 * @return {!{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}}
 */
recoil.structs.table.SwapUnion.prototype.inverse = function(table, sources) {
    var tables = [sources.table1.createEmpty(), sources.table2.createEmpty()];
    var me = this;
    table.forEach(function(row) {
        var src = me.srcFunc_(row);
        if (src < 0 || src > 1) {
            throw 'Unknown destination';
        }
        tables[src].addRow(row);
    });
    return {table1: tables[0].freeze(), table2: tables[1].freeze()};
};

