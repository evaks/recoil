/**
 * provides a behaviour of a cell in a table
 * with this behaviour you should be able to set and get the value
 * however the meta data will be read only
 */

goog.provide('recoil.frp.table.TableCell');
goog.provide('recoil.frp.table.TableRow');



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
recoil.frp.table.TableCell.create = function (frp, table, key, column) {
    
    
};

