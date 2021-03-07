goog.provide('recoil.structs.table.ChangeCol');
goog.provide('recoil.structs.table.ChangeColType');

goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.UniqKeyGenerator');

/**
 * @enum {number}
 */
recoil.structs.table.ChangeColType = {
    DELETE: 1, CHANGE: 2, ADD: 3, NONE: 0
};

/**
 * this class adds changed column to the a table indicating it is changed
 * the inputs are
 * orig: is the original unchanged table, the primary keys are initially used to
 *       determine which keys match the others however if those primary keys change in
 *       in table they will still map original primary keys
 * table: the table to add the change column to it must have a unique immutable primary key,
 *        but those keys do not have to match the orig, however all primay key columns must
 *        in orig must exist in table. Also all the placed columns in table must exist orig.
 *        In order to add a immutable primary key to a table use recoil.structs.table.ImmutablePk
 * meta:  the meta data to add to the duplicates column
 * changeCol: the column key to use for the change column
 *
 * note any changes to cells (especially orig primary keys) should be done through the output, but removes and adds
 * should be done directly to table
 *
 * @implements  {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table,orig:!recoil.structs.table.Table,meta:!Object,deleteMeta:!Object},
 !{table:!recoil.structs.table.Table}>}>}
 * @param {!recoil.structs.table.ColumnKey<!{changes:!Object,type:!recoil.structs.table.ChangeColType}>} changeCol
 * @constructor
 */

recoil.structs.table.ChangeCol = function(changeCol) {
    this.changeCol_ = changeCol;
    this.origKeysCol_ = new recoil.structs.table.ColumnKey('$orig.key');
    /**
     * @private
     * map from unique primary key to inital value the row came in as
     * @type {!goog.structs.AvlTree<{key:Array<?>,orig:Array<?>}>}
     */
    this.pkMap_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
    this.oldKeys_ = new goog.structs.AvlTree(recoil.util.object.compare);

};

/**
 * @param {{table:!recoil.structs.table.Table, meta:!Object, orig:?, deleteMeta:(undefined|Object)}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.ChangeCol.prototype.calculate = function(params) {
    var res = params.table.createEmptyAddCols(params.table.getPrimaryColumns(), [this.changeCol_, this.origKeysCol_]);
    res.setColumnMeta(this.changeCol_, params.meta);
    var tableMeta = params.table.getMeta();
    var me = this;
    var pk = params.table.getPrimaryColumns()[0];
    var curRowMap = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var origKeys = new goog.structs.AvlTree(recoil.util.object.compare);
    var keyGen = new recoil.structs.table.UniqKeyGenerator(params.table);
    var pos = 0;
    var newRows = [];

    params.orig.forEach(function(oldRow, key) {
        origKeys.add(key);
    });

    // reset pkMap if the original primary keys have changed
    if (!origKeys.equals(this.oldKeys_)) {
        this.pkMap_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
    }
    this.oldKeys_ = origKeys;
    // create a map from original to key to current row, and a list of new rows

    params.table.forEach(function(row, ids) {
        var key = params.orig.getRowKeys(row);
        var origKey = me.pkMap_.findFirst({key: ids, orig: []});
        if (origKey) {
            key = origKey.orig;
        }

        curRowMap.add({key: key, row: row});
        if (!origKeys.findFirst(key)) {
            newRows.push(row);
        }
    });

    // we will put new rows on the end
    params.orig.forEach(function(oldRow, key) {
        var curRow = curRowMap.findFirst({key: key});
        var newRow;
        if (curRow) {
            newRow = curRow.row.unfreeze();
            var changes = {};
            var changed = false;
            params.table.forEachPlacedColumn(function(col) {
                var newVal = newRow.get(col);
                var oldVal = oldRow.get(col);
                var newMeta = params.table.getFullCellMeta(key, col);
                if (!recoil.util.object.isEqual(newVal, oldVal) && newMeta.enabled !== false && newMeta.visible !== false) {
                    changes[col] = oldVal;
                    changed = true;
                }
            });
            newRow.set(me.origKeysCol_, key);
            newRow.set(me.changeCol_, {changes: changes,
                                       type: changed ? recoil.structs.table.ChangeColType.CHANGE :
                                       recoil.structs.table.ChangeColType.NONE});
        }
        else {
            // pick a new primary key
            newRow = oldRow.unfreeze();
            newRow.set(pk, keyGen.nextPk());
            newRow.set(me.origKeysCol_, key);
            newRow.addRowMeta(params.deleteMeta);
            newRow.set(me.changeCol_, {changes: {}, type: recoil.structs.table.ChangeColType.DELETE});
        }
        newRow.setPos(pos++);
        res.addRow(newRow);
    });

    // new rows
    newRows.forEach(function(row) {
        var newRow = row.unfreeze();
        newRow.set(me.changeCol_, {changes: {}, type: recoil.structs.table.ChangeColType.ADD});
        newRow.setPos(pos++);
        newRow.set(me.origKeysCol_, null);
        res.addRow(newRow);
    });
    return res.freeze();
};

/**
 *
 * @param {!recoil.structs.table.Table} table
 * @param {!{table:!recoil.structs.table.Table,orig:recoil.structs.table.Table,meta:!Object,deleteMeta:!Object}} sources
 * @return {!{table:!recoil.structs.table.Table}}
 */
recoil.structs.table.ChangeCol.prototype.inverse = function(table, sources) {

    var dest = sources.table.createEmpty();
    var me = this;
    var newPkMap = new goog.structs.AvlTree(recoil.util.object.compareKey);

    table.forEach(function(row, key) {
        var change = row.get(me.changeCol_);

        if (change.type === recoil.structs.table.ChangeColType.DELETE) {
            // do nothing row was deleted
            // deleted rows cannot have there keys changed and are always the original

        }
        else {
            var oldKeys = row.get(me.origKeysCol_);

            if (oldKeys) {
                var curKeys = sources.orig.getRowKeys(row);
                if (!recoil.util.object.isEqual(curKeys, oldKeys)) {
                    newPkMap.add({key: key, orig: oldKeys});
                }
            }
            dest.addRow(row);
        }
    });
    this.pkMap_ = newPkMap;
    return {table: dest.freeze()};
};



/**
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} tableB
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>|!recoil.structs.table.Table} orig
 * @param {!recoil.structs.table.ColumnKey<!{changes:!Object,type:!recoil.structs.table.ChangeColType}>} changeCol
 * @param {!recoil.frp.Behaviour<!Object>|!Object} changeColMeta
 * @param {!recoil.frp.Behaviour<!Object>|!Object} deleteRowMeta
 * @return {!recoil.frp.Behaviour<!recoil.structs.table.Table>}
 */
recoil.structs.table.ChangeCol.createB = function(tableB, orig, changeCol, changeColMeta, deleteRowMeta) {
    return recoil.frp.Inversable.create(tableB.frp(), new recoil.structs.table.ChangeCol(changeCol),
                                        {table: tableB, orig: orig, meta: changeColMeta, deleteMeta: deleteRowMeta});
};
