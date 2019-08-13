goog.provide('recoil.structs.table.Union');


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
 {table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table},
 {table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}>}>}
 * @constructor
 * @param {boolean} uniqPk if this is true we will use the primary key of table1, otherwize an integer primary key will be generated
 *                         if this is true an error will be thrown if the union doesn't have a uniq primay key
 * @param {boolean} uniq   this will remove duplicate rows if true
 * @param {!recoil.structs.table.ColumnKey<!Array<number>>=} opt_srcCol supply column for src, allows adding
 * @param {!Array<string>=} opt_concatPk if exists overrides uniqPk and will concat the associated index to the pk to make the key uniqu
 *                                      this only works if you have 1 string primary key that cannot end with the concatination
 */

recoil.structs.table.Union = function(uniqPk, uniq, opt_srcCol, opt_concatPk) {
    this.primaryKey_ = uniqPk || opt_concatPk ? null : new recoil.structs.table.ColumnKey('$id');
    this.uniq_ = uniq;
    this.concatPk_ = opt_concatPk;
    this.srcCol_ = opt_srcCol || new recoil.structs.table.ColumnKey('$src', undefined, undefined,  /** @type {Array<number>?}*/(null));
};
/**
 * @private
 * @param {!recoil.structs.table.Table} table
 * @param {!recoil.structs.table.TableRow} row
 * @return {!Array<?>} every value in the row
 */
recoil.structs.table.Union.prototype.getRowValues_ = function(table, row) {
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
recoil.structs.table.Union.prototype.calculate = function(params) {
    var me = this;
    var tables = [params.table1, params.table2];

    var pks = this.primaryKey_ ? [this.primaryKey_] : tables[0].getPrimaryColumns();
    var other = this.primaryKey_ ? tables[0].getPrimaryColumns().concat(tables[0].getOtherColumns()) : tables[0].getOtherColumns();
    other = other.concat(this.srcCol_);
    var result = new recoil.structs.table.MutableTable(pks, other);

    var seen = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var removeDups = this.uniq_;
    var pos = 0;

    if (this.concatPk_ && pks.length > 1) {
        throw new Error('you can only have one pk to use concat pks');
    }

    for (var i = 0; i < tables.length; i++) {
        var table = tables[i];
        var pkConcat = this.concatPk_ ? this.concatPk_[i] : null;
        result.addMeta(table.getMeta());

        table.getColumns().forEach(function(col) {
            result.addColumnMeta(col, table.getColumnMeta(col));
        });
        table.forEach(function(row, key) {
            if (removeDups) {
                var rowValues = me.getRowValues_(table, row);
                var existing = seen.findFirst({key: rowValues});
                if (existing) {
                    result.set(key, me.srcCol_, result.get(key, me.srcCol_).concat([i]));
                    return;
                }
                seen.add({key: rowValues, row: row});
            }
            var newRow = row.setCell(me.srcCol_, new recoil.structs.table.TableCell([i]));
            if (me.primaryKey_) {
                newRow = newRow.setCell(me.primaryKey_, new recoil.structs.table.TableCell(pos));
            }
            else if (me.concatPk_) {

                newRow = newRow.set(pks[0], key[0] + me.concatPk_[i]);
            }
            result.addRow(newRow);
            pos++;
        });
    }
    return result.freeze();
};

/**
 * @param {!recoil.structs.table.Table} table
 * @param {{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}} sources
 * @return {{table1:!recoil.structs.table.Table, table2:!recoil.structs.table.Table}}
 */
recoil.structs.table.Union.prototype.inverse = function(table, sources) {
    var tables = [sources.table1.createEmpty(), sources.table2.createEmpty()];
    var me = this;
    var keyCol = me.concatPk_ ? tables[0].getPrimaryColumns()[0] : null;
    table.forEach(function(row) {
        var srcs = row.get(me.srcCol_);
        srcs.forEach(function(src) {
            if (src >= 0 && src < tables.length) {
                var concatLen = me.concatPk_ ? me.concatPk_[src].length : 0;
                if (keyCol) {
                    var key = row.get(keyCol);
                    var newKey = key.substr(0, key.length - concatLen);
                    row = row.set(keyCol, newKey);
                }
                tables[src].addRow(row);
            }
            else {
                throw 'Unknown destination';
            }
        });
    });
    return {table1: tables[0].freeze(), table2: tables[1].freeze()};
};


/**
 * @param {recoil.frp.Behaviour} table1B
 * @param {recoil.frp.Behaviour} table2B
 * @param {boolean} uniqPk if this is true we will use the primary key of table1, otherwize an integer primary key will be generated
 *                         if this is true an error will be thrown if the union doesn't have a uniq primay key
 * @param {boolean} uniq   this will remove duplicate rows if true
 * @param {!recoil.structs.table.ColumnKey<!Array<number>>=} opt_srcCol supply column for src, allows adding
 * @param {!Array<string>=} opt_concatPk if exists overrides uniqPk and will concat the associated index to the pk to make the key uniqu
 *                                      this only works if you have 1 string primary key that cannot end with the concatination
 * @return {!recoil.frp.Behaviour<!recoil.structs.table.Table>}
 */
recoil.structs.table.Union.createB = function(table1B, table2B, uniqPk, uniq, opt_srcCol, opt_concatPk) {
    return recoil.frp.Inversable.create(
        table1B.frp(),
        new recoil.structs.table.Union(uniqPk, uniq, opt_srcCol, opt_concatPk),

        {table1: table1B, table2: table2B});
};
