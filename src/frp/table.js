/**
 * provides a behaviour of a cell in a table
 * with this behaviour you should be able to set and get the value
 * however the meta data will be read only
 */

goog.provide('recoil.frp.table.Table');
goog.provide('recoil.frp.table.TableCell');
goog.provide('recoil.frp.table.TableRow');
goog.require('goog.object');
goog.require('recoil.frp.BStatus');
goog.require('recoil.frp.Util');
goog.require('recoil.structs.table.TableCell');

/**
 * @param {!recoil.frp.Frp} frp the frp engine
 * @param {recoil.structs.table.Table|recoil.frp.Behaviour<recoil.structs.table.Table>}  tableV
 * @param {!Array<?>|recoil.frp.Behaviour<!Array<?>>}  keysV
 * @return {recoil.frp.Behaviour<recoil.structs.table.TableRow>}
 */
recoil.frp.table.TableRow.create = function(frp, tableV, keysV) {
    var util = new recoil.frp.Util(frp);

    var keys = util.toBehaviour(keysV);
    var table = util.toBehaviour(tableV);

    return frp.statusLiftBI(
        function() {
            var row = table.get().getRow(keys.get());
            if (row === null) {
                return recoil.frp.BStatus.notReady();
            }

            return new recoil.frp.BStatus(row);
        },
        function(row) {
            var mTable = table.get().unfreeze();
            mTable.setRow(keys.get(), row);
            table.set(mTable.freeze());
        }, table, keys);
};

/**
 * @template T
 * @param {!recoil.structs.table.TableRow|!recoil.frp.Behaviour<!recoil.structs.table.TableRow>}  row
 * @param {!recoil.structs.table.ColumnKey<T>|recoil.frp.Behaviour<!recoil.structs.table.ColumnKey<T>>} columnKey
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.table.TableRow.get = function(row, columnKey) {
    var frp = recoil.frp.util.getFrp(arguments);
    var util = new recoil.frp.Util(frp);

    var rowB = util.toBehaviour(row);
    var columnB = util.toBehaviour(columnKey);

    return frp.liftBI(
        function(row, column) {
            return row.get(column);
        },
        function(val) {
            rowB.set(rowB.get().set(columnB.get(), val));
        }, rowB, columnB);
};


/**
 * like get but allows null rows, this is not inversable for now
 *
 * @template T
 * @param {recoil.structs.table.TableRow|!recoil.frp.Behaviour<recoil.structs.table.TableRow>}  row
 * @param {!recoil.structs.table.ColumnKey<T>|recoil.frp.Behaviour<!recoil.structs.table.ColumnKey<T>>} columnKey
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.table.TableRow.safeGet = function(row, columnKey) {
    var frp = recoil.frp.util.getFrp(arguments);
    var util = new recoil.frp.Util(frp);

    var rowB = util.toBehaviour(row);
    var columnB = util.toBehaviour(columnKey);

    return frp.liftB(
        function(row, column) {
            if (!row) {
                return null;
            }
            return row.get(column);
        },
        rowB, columnB);
};

/**
 * this wil return an bidirectional table cell it will contain the meta data from the
 * cell, column, row, and table.
 *
 * @param {!recoil.frp.Frp} frp the frp engine
 * @param {!recoil.structs.table.Table|recoil.frp.Behaviour<!recoil.structs.table.Table>}  tableV
 * @param {!Array<?>|!recoil.frp.Behaviour<!Array<?>>}  keysV
 * @param {!recoil.structs.table.ColumnKey|recoil.frp.Behaviour<!recoil.structs.table.ColumnKey>} columnV
 * @return {!recoil.frp.Behaviour<!recoil.structs.table.TableCell>}
 **/

recoil.frp.table.TableCell.create = function(frp, tableV, keysV, columnV) {
    var util = new recoil.frp.Util(frp);
    var tableB = util.toBehaviour(tableV);
    var keysB = util.toBehaviour(keysV);

    var columnB = util.toBehaviour(columnV);

    return frp.liftBI(
        function(table, keys, column) {
            var cell = table.getCell(keys, column);
            var tableMeta = table.getMeta();
            var rowMeta = table.getRowMeta(keys);
            var columnMeta = table.getColumnMeta(column);
            var meta = {};

            if (cell === null) {
                throw 'cell not found';
            }

            goog.object.extend(meta, tableMeta, rowMeta, columnMeta, cell.getMeta());

            return cell.setMeta(meta);

        },
        function(val) {
            var mTable = tableB.get().unfreeze();
            mTable.setCell(keysB.get(), columnB.get(), val);
            tableB.set(mTable.freeze());
        }, tableB, keysB, columnB);
};

/**
 * this wil return an bidirectional table cell it will contain the meta data from the
 * cell, column, row, and table. Setting the meta data will have no effect
 *
 * @param {!recoil.frp.Frp} frp the frp engine
 * @param {!recoil.structs.table.Table|!recoil.frp.Behaviour<recoil.structs.table.Table>}  tableV
 * @param {!recoil.structs.table.ColumnKey|!recoil.frp.Behaviour<!recoil.structs.table.ColumnKey>} columnV
 * @return {!recoil.frp.Behaviour<!recoil.structs.table.TableCell>}
 **/
recoil.frp.table.TableCell.createHeader = function(frp, tableV, columnV) {
    var util = new recoil.frp.Util(frp);

    var tableB = util.toBehaviour(tableV);
    var columnB = util.toBehaviour(columnV);

    return frp.liftB(
        function(table, column) {
            var tableMeta = table.getMeta();
            var columnMeta = table.getColumnMeta(column);
            var meta = {};

            goog.object.extend(meta, tableMeta, columnMeta);

            return new recoil.structs.table.TableCell(undefined, meta);

        }, tableB, columnB);

};


/**
 * gets just the meta information out of a cell
 * @template CT
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<recoil.structs.table.TableCell<CT>>} cellB
 * @return {!recoil.frp.Behaviour<CT>}
 */
recoil.frp.table.TableCell.getValue = function(frp, cellB) {
    return frp.liftBI(
        function(cell) {
            return cell.getValue();
        },
        function(val) {
            cellB.set(cellB.get().setValue(val));
        }, cellB);
};



/**
 * gets just the meta information out of a cell
 * @template CT
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<recoil.structs.table.TableCell<CT>>} cellB
 * @return {!recoil.frp.Behaviour<*>}
 */

recoil.frp.table.TableCell.getMeta = function(frp, cellB) {
    return frp.liftBI(
        function(cell) {
            return cell.getMeta();
        }, function(meta) {
            if (cellB.good()) {
                cellB.set(cellB.get().setMeta(meta));
            }
        },
        cellB);
};



/**
 * makes a map from the key -> value column
 * @template T
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} tableB
 * @param {recoil.structs.table.ColumnKey} key
 * @param {recoil.structs.table.ColumnKey<T>} value
 * @return {!recoil.frp.Behaviour<!Object<string,T>>}
 */

recoil.frp.table.Table.toMap = function(tableB, key, value) {
    return tableB.frp().liftB(function(t) {
        var res = {};
        t.forEach(function(row) {
            res[row.get(key)] = row.get(value);
        });
        return res;
    }, tableB);
};

/**
 * makes a map from the key -> value column
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} tableB
 * @param {recoil.structs.table.ColumnKey} key
 * @return {!recoil.frp.Behaviour<!Object<string,!recoil.structs.table.TableRow>>}
 */

recoil.frp.table.Table.toRowMap = function(tableB, key) {
    return tableB.frp().liftB(function(t) {
        var res = {};
        t.forEach(function(row) {
            res[row.get(key)] = row;
        });
        return res;
    }, tableB);
};



/**
 * makes a map from the key -> value column
 * @template T
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} allB
 * @param {!recoil.frp.Behaviour<!Object>} usedB
 * @param {recoil.structs.table.ColumnKey<T>} key
 * @return {!recoil.frp.Behaviour<!Array<T>>}
 */

recoil.frp.table.Table.unused = function(allB,  usedB, key) {
    return allB.frp().liftB(function(t, used) {
        var res = [];
        t.forEach(function(row) {
            var v = row.get(key);
            if (!used[v]) {
                res.push(v);
            }
        });
        return res;
    }, allB, usedB);
};


/**
 * gets 1 column and returns it as a list
 * @param {recoil.frp.Behaviour<recoil.structs.table.TableInterface>} tblB
 * @param {recoil.structs.table.ColumnKey} col
 * @return {!recoil.frp.Behaviour<Array>}
 */
recoil.frp.table.colList = function(tblB, col) {
    return tblB.frp().liftB(function(tbl) {
        var res = [];
        tbl.forEach(function(r) {
            res.push(r.get(col));
        });
        return res;
    }, tblB);
};
