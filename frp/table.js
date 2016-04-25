/**
 * provides a behaviour of a cell in a table
 * with this behaviour you should be able to set and get the value
 * however the meta data will be read only
 */

goog.provide('recoil.frp.table.TableCell');
goog.provide('recoil.frp.table.TableRow');


goog.require('goog.object');

/**
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {recoil.struct.table.Table|recoil.frp.Behaviour<recoil.struct.table.Table>}  table
 * @param {Array<*>|recoil.frp.Behaviour<recoil.struct.table.Table>}  keys
 * @return {recoil.frp.Behaviour<recoil.structs.table.TableRow>}
 */
recoil.frp.table.TableRow.create = function (frp, table, keys) {
    var util = new recoil.frp.Util(frp);
    
    keys = util.toBehaviour(keys);
    table = util.toBehaviour(table);

    return frp.statusLiftBI(
        function () {
            var row = table.get(keys.get());
            if (row === null) {
                return recoil.frp.BStatus.notReady();
            }

            return new recoil.frp.BStatus(row);
        },
        function (row) {
            var mTable = new recoil.struct.MutableTable.createFromTable(table.get());
            mTable.setRow(row);
            table.set(mTable.freeze());
        }, table, keys);
};

/**
 * this wil return an bidirectional table cell it will contain the meta data from the
 * cell, column, row, and table. Setting the meta data will have no effect
 *
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {recoil.struct.table.Table|recoil.frp.Behaviour<recoil.struct.table.Table>}  table
 * @param {Array<*>|recoil.frp.Behaviour<recoil.struct.table.Table>}  keys
 * @param {recoil.structs.table.ColumnKey|recoil.frp.Behaviur<recoil.structs.table.ColumnKey>} column
 * @return {recoil.frp.Behaviour<recoil.structs.table.TableCell>}
 **/

recoil.frp.table.TableCell.create = function (frp, table, keys, column) {
    
    var util = new recoil.frp.Util(frp);
    

    table = util.toBehaviour(table);
    keys = util.toBehaviour(keys);

    column = util.toBehaviour(column);
    
    return frp.liftBI(
        function () {
            var  cell = table.get().getCell(keys.get(), column.get());
            var  tableMeta = table.getMeta();
            var  rowMeta = table.getRowMeta(keys.get());
            var  columnMeta = table.getColumnMeta(column.get());
            var meta = {};

            if (cell === null) {
                throw "cell not found";
            }
            
            goog.object.extend(meta, tableMeta, rowMeta, columnMeta, cell.getMeta());
            
            return new recoil.frp.BStatus(cell.setMeta(meta));
            
        },
        function (val) {
            table.set(table.get().unfreeze().set(keys.get(), column.get(), val));
        }, table, keys, column);
};

