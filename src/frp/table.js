/**
 * provides a behaviour of a cell in a table
 * with this behaviour you should be able to set and get the value
 * however the meta data will be read only
 */

goog.provide('recoil.frp.table.TableCell');
goog.provide('recoil.frp.table.TableRow');


goog.require('goog.object');

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
 * this wil return an bidirectional table cell it will contain the meta data from the
 * cell, column, row, and table. Setting the meta data will have no effect
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
            mTable.set(keysB.get(), columnB.get(), val.getValue());
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
 * @param {recoil.frp.Behaviour<recoil.structs.table.TableCell<CT>>} cellB
 * @return {!recoil.frp.Behaviour<*>}
 */

recoil.frp.table.TableCell.getMeta = function(frp, cellB) {
    return frp.liftBI(
        function(cell) {
            return cell.getMeta();
        }, function(meta) {
            cellB.set(cellB.get().setMeta(meta));
        },
        cellB);
};
