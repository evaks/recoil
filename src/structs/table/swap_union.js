goog.provide('recoil.structs.table.SwapUnion');


goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Order');
goog.require('recoil.structs.table.Table');
goog.require('recoil.util.object');

/**
 * does a sql union on 2 tables, this is like union the source table can change depending on the
 * what data in the table is. this assumes the primary key is unique across the tables
 *
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table},
 !{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}>}>}
 * @constructor
 * @param {!Array<recoil.structs.table.ColumnKey>} idCols columns that are set will come back the same primary keys may change if new row
 * @param {!function(!recoil.structs.table.TableRow):number} srcFunc function to determine which src the row should be written out to
 */

recoil.structs.table.SwapUnion = function(idCols, srcFunc) {
    this.idCols_ = idCols;
    this.srcFunc_ = srcFunc;
    this.order_ = new recoil.structs.table.Order();
};


/**
 * @return {recoil.structs.table.SwapUnion}
 */
recoil.structs.table.SwapUnion.prototype.clone = function() {
    var res = new recoil.structs.table.SwapUnion(this.idCols_, this.srcFunc_);
    return res;
};

/**
 * @param {{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.SwapUnion.prototype.calculate = function(params) {
    var me = this;
    var tables = [params.table1, params.table2];

    var result = params.table1.createEmpty();
    this.order_.start();
    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        result.addMeta(table.getMeta());
        table.getColumns().forEach(function(col) {
            result.addColumnMeta(col, table.getColumnMeta(col));
        });

        table.forEach(function(row, keys) {
            me.order_.addRow(row);
        });
    }
    me.order_.apply(result);
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
    this.order_.rememberStart(this.idCols_);
    table.forEach(function(row) {
        var src = me.srcFunc_(row);
        if (src < 0 || src > 1) {
            throw 'Unknown destination';
        }
        tables[src].addRow(row);
        me.order_.remember(row);
    });
    return {table1: tables[0].freeze(), table2: tables[1].freeze()};
};



