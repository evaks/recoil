/**
 * @fileoverview
 * tables may contain sub tables, represented as objects which we may want to access as just a table,
 * this
 */
goog.provide('recoil.structs.table.ExpandCols');
goog.provide('recoil.structs.table.ExpandColsDef');

goog.require('recoil.db.ChangeSet.Path');
goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.MutableTableRow');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRowInterface');

/**
 * @interface
 */
recoil.structs.table.ExpandColsDef = function() {};

/**
 * @param {!recoil.structs.table.TableRowInterface} row
 * @return {!recoil.structs.table.TableRowInterface}
 */
recoil.structs.table.ExpandColsDef.prototype.getSubRow = function(row) {};

/**
 * @param {!recoil.structs.table.MutableTableRow} row
 */
recoil.structs.table.ExpandColsDef.prototype.setSubRow = function(row) {};

/**
 * @return {!Array<!{col:!recoil.structs.table.ColumnKey,meta:!Object}>}
 */
recoil.structs.table.ExpandColsDef.prototype.getColumns = function() {};

/**
 * @return {!recoil.structs.table.ColumnKey}
 */
recoil.structs.table.ExpandColsDef.prototype.getSrcCol = function() {};

/**
 * @implements {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table,expand:!Array<!recoil.structs.table.ExpandColsDef>},
 !{table:!recoil.structs.table.Table}>}>}
 * @constructor
 */
recoil.structs.table.ExpandCols = function() {
};


/**
 * @param {{table:!recoil.structs.table.Table,expand:!Array<!recoil.structs.table.ExpandColsDef>}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.ExpandCols.prototype.calculate = function(params) {
    var me = this;
    var table = params.table;
    var expandInfos = params.expand;
    var extraMeta = [];
    var extraCols = [];
    expandInfos.forEach(function(info) {
        info.getColumns().forEach(function(colInfo) {
            extraCols.push(colInfo.col);
            extraMeta.push(colInfo.meta);
        });
    });
    var res = table.createEmpty(undefined, extraCols);

    for (var i = 0; i < extraCols.length; i++) {
        res.setColumnMeta(extraCols[i], extraMeta[i]);
    }
    table.forEach(function(row, pk) {
        var mrow = row.unfreeze();
        expandInfos.forEach(function(info) {
            mrow.addColumns(info.getSubRow(row));
        });
        res.addRow(mrow);
    });
    return res.freeze();
};


/**
 * for now we do not handle adding new rows, that would be like adding a new
 * column, or adding new columns
 *
 * @param {!recoil.structs.table.Table} table
 * @param {!{table:!recoil.structs.table.Table,expand:!Array<!recoil.structs.table.ExpandColsDef>}} sources
 * @return {!{table:!recoil.structs.table.Table}}
 */
recoil.structs.table.ExpandCols.prototype.inverse = function(table, sources) {
    var dest = sources.table.createEmpty();
    var expandInfos = sources.expand;

    table.forEach(function(row, pk) {
        var mrow = row.unfreeze();
        expandInfos.forEach(function(info) {
            info.setSubRow(mrow);
        });
        dest.addRow(mrow);
    });
    return {table: dest.freeze()};
};


/**
 * @constructor
 * @implements {recoil.structs.table.ExpandColsDef}
 * @param {!function(recoil.structs.table.TableRowInterface,boolean):?} check function to check outer object exists, the first parameter is the row that we are setting/getting the second is true if we are setting, this should return true or false, or null if we should set the container to null
 * @param {!recoil.structs.table.ColumnKey} col
 * @param {function (!Object,!recoil.structs.table.ColumnKey,!recoil.db.ChangeSet.Path): !Object} metaGetter this extracts meta data from the cell meta for the subcell
 *  for example errors
 * @param {!Array<!{col:!recoil.structs.table.ColumnKey,path:!recoil.db.ChangeSet.Path,defaultVal:*,meta:(!Object|undefined)}>} subcols
 */
recoil.structs.table.ExpandCols.PresenceDef = function(check, col, metaGetter, subcols) {
    this.metaGetter_ = metaGetter || function(meta, col, path) {return {};};
    this.check_ = check;
    this.col_ = col;
    this.subcols_ = subcols;
};

/**
 * @param {!recoil.structs.table.TableRowInterface} row
 * @return {!recoil.structs.table.TableRowInterface}
 */
recoil.structs.table.ExpandCols.PresenceDef.prototype.getSubRow = function(row) {
    var res = new recoil.structs.table.MutableTableRow();
    var exists = this.check_(row, false);
    var val = row.get(this.col_);
    var meta = row.getCellMeta(this.col_);
    var metaGetter = this.metaGetter_;
    var col = this.col_;
    this.subcols_.forEach(function(info) {
        var curVal = exists ? val : null;
        if (exists) {
            info.path.parts().forEach(function(part) {
                if (curVal) {
                    curVal = curVal[part];
                }
            });

            res.addCellMeta(info.col, metaGetter(meta, col, info.path));
        }


        res.set(info.col, curVal);
    });
    return res;
};

/**
 * @param {!recoil.structs.table.MutableTableRow} row
 */
recoil.structs.table.ExpandCols.PresenceDef.prototype.setSubRow = function(row) {
    var exists = this.check_(row, true);
    var val = recoil.util.object.clone(row.get(this.col_) || {});
    if (exists) {
        this.subcols_.forEach(function(info) {
            var newVal = row.get(info.col);
            if (newVal === null && info.defaultVal !== undefined) {
                newVal = info.defaultVal;
            }
            var prevVal = val;
            var parts = info.path.parts();

            for (var i = 0; i < parts.length - 1; i++) {
                prevVal[parts[i]] = prevVal[parts[i]] || {};
                prevVal = prevVal[parts[i]];
            }

            prevVal[parts[parts.length - 1]] = newVal;
        });
        row.set(this.col_, val);
    }
    else if (exists === null) {
        row.set(this.col_, null);
    }

};
/**
 * @return {!Array<!{col:!recoil.structs.table.ColumnKey,meta:!Object}>}
 */
recoil.structs.table.ExpandCols.PresenceDef.prototype.getColumns = function() {
    var res = [];
    this.subcols_.forEach(function(info) {
        res.push({col: info.col, meta: info.meta || {}});
    });
    return res;
};

/**
 * @return {!recoil.structs.table.ColumnKey}
 */
recoil.structs.table.ExpandCols.PresenceDef.prototype.getSrcCol = function() {
    return this.col_;
};
