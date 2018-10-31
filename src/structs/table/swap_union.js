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
 !{tables:!Array<!recoil.structs.table.Table>},
 !{tables:!Array<!recoil.structs.table.Table>}>}
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
 * @param {{tables:Array<!recoil.structs.table.Table>}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.SwapUnion.prototype.calculate = function(params) {
    var me = this;
    var tables = params.tables;

    var result = params.tables[0].createEmpty();
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
 * @param {!{tables:!Array<!recoil.structs.table.Table>}} sources
 * @return {!{tables:!Array<!recoil.structs.table.Table>}}
 */
recoil.structs.table.SwapUnion.prototype.inverse = function(table, sources) {

    var tables = [];

    sources.tables.forEach(function(table) {
        tables.push(table.createEmpty());
    });
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
    var res = [];

    tables.forEach(function(table) {
        res.push(table.freeze());
    });
    return {tables: res};
};


/**
 * @param {!Array<recoil.structs.table.ColumnKey>} idCols columns that are set will come back the same primary keys may change if new row
 * @param {!function(!recoil.structs.table.TableRow):number} srcFunc function to determine which src the row should be written out to
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>|!recoil.frp.Behaviour<recoil.structs.table.Table>} first
 * @param {...(!recoil.frp.Behaviour<!recoil.structs.table.Table>|!recoil.frp.Behaviour<recoil.structs.table.Table>|recoil.structs.table.Table)} var_rest
 * @return {!{tables:Array<!recoil.structs.table.Table>}}
 */
recoil.structs.table.SwapUnion.createB = function(idCols, srcFunc, first, var_rest) {
    var frp = first.frp();
    var util = new recoil.frp.Util(frp);
    var tables = [];

    for (var i = 2; i < arguments.length; i++) {
        tables.push(util.toBehaviour(arguments[i]));
    }
    var args = [
        function() {
            var res = [];
            tables.forEach(function(t) {
                res.push(t.get());
            });
            return res;
        },
        function(out) {
            for (var i = 0; i < out.length; i++) {
                tables[i].set(out[i]);
            }
        }
    ];


    var tablesB = frp.liftBI.apply(frp, args.concat(tables));

    return recoil.frp.Inversable.create(frp, new recoil.structs.table.SwapUnion(idCols, srcFunc), {tables: tablesB});
};


