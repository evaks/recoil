goog.provide('recoil.structs.table.ImmutablePk');

goog.require('recoil.frp.Inversable');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');

/**
 * this class provides a mechinim to take a table with multiple, mutable primary
 * keys and convert it to a table that has 1 unique number primary key that does not change
 * it does so by creating a mapping from the old primary key to the new,
 * there are cases where the inverse will not set source table when the user has changed the original primary
 * so that it is not unique, in that case the output table will remain, and the DUPLICATES column will contain a list
 * of output primary keys that match
 * @implements  {recoil.frp.Inversable<!recoil.structs.table.Table,
 !{table:!recoil.structs.table.Table},
 !{table:!recoil.structs.table.Table}>}>}
 * @param {!recoil.structs.table.ColumnKey<!Array<!number>>=} opt_dupsCol
 * @constructor
 */

recoil.structs.table.ImmutablePk = function(opt_dupsCol) {
    this.pk_ = new recoil.structs.table.ColumnKey('$immutable.key');
    this.origPk_ = new recoil.structs.table.ColumnKey('$orig.key', undefined, undefined, /** @type Array */ (null));
    this.DUPLICATES = opt_dupsCol || new recoil.structs.table.ColumnKey('$duplicate', undefined, undefined,  /** @type Array<!number> */ ([]));
    // a map from the primary key to the generated primary key
    this.pkMap_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
    /**
     * @type {!Array<{row: !recoil.structs.table.TableRow, pos: number}>}
     * @private
     */
    this.newDups_ = [];
};

/**
 * @type {!recoil.structs.table.ColumnKey<!Array<number>>}
 * @final
 */
recoil.structs.table.ImmutablePk.DUPLICATES = new recoil.structs.table.ColumnKey('$duplicate', undefined, undefined,/** @type !Array<!number> */ ([]));

/**
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} tableB
 * @param {!recoil.structs.table.ColumnKey<!Array<number>>=} opt_dupsCol
 * @return {!recoil.frp.Behaviour<!recoil.structs.table.Table>}
 */
recoil.structs.table.ImmutablePk.createB = function(tableB, opt_dupsCol) {
    return recoil.frp.Inversable.create(tableB.frp(), new recoil.structs.table.ImmutablePk(opt_dupsCol), {table: tableB});
};
/**
 * @param {{table:!recoil.structs.table.Table}} params
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.ImmutablePk.prototype.calculate = function(params) {
    var res = params.table.createEmptyAddCols([this.pk_], [this.origPk_, this.DUPLICATES]);
    var me = this;
    var unsetPos = 0;
    var pos = 0;
    var toRemove = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var primaryColumns = params.table.getPrimaryColumns();
    var pkToRowId = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var getDups = function(pk, id) {
        var dups = pkToRowId.findFirst({key: pk}).ids;
        if (dups.length === 1) {
            return [];
        }
        else {
            dups = goog.array.clone(dups);
            goog.array.remove(dups, id);
        }
        return dups;
    };
    // calculate the max primary key
    var usedOutPk = new goog.structs.AvlTree();
    me.newDups_.forEach(function(v) {
        var id = v.row.get(me.pk_);
        var pk = params.table.getRowKeys(v.row);
        usedOutPk.add(id);
        pkToRowId.safeFind({key: pk, ids: []}).ids.push(id);
    });

    me.pkMap_.inOrderTraverse(function(v) {
        toRemove.add(v);
        usedOutPk.add(v.id);
    });
    var freePk = usedOutPk.getCount() > 0 ? usedOutPk.getMaximum() + 1 : 0;

    params.table.forEach(function(immutableRow, key) {
        var existingMapping = me.pkMap_.findFirst({key: key});
        toRemove.remove({key: key});
        if (existingMapping) {
            if (existingMapping.newPk) {
                pkToRowId.safeFind({key: existingMapping.newPk, ids: []}).ids.push(existingMapping.id);
            }
            else {
                pkToRowId.safeFind({key: key, ids: []}).ids.push(existingMapping.id);
            }
        }
        else {
            var pk = freePk;
            pkToRowId.add({key: key, ids: [pk]});
            me.pkMap_.add({key: key, id: pk});
            freePk++;
        }

    });




    params.table.forEach(function(immutableRow, key) {
        // add all the duplicates that do not exist in the source
        var dups;
        while (unsetPos < me.newDups_.length && me.newDups_[unsetPos].pos <= pos) {
            var newRow = me.newDups_[unsetPos++].row.unfreeze();
            newRow.set(me.DUPLICATES, getDups(params.table.getRowKeys(newRow), newRow.get(me.pk_)));
            res.addRow(newRow);
        }

        var existingMapping = me.pkMap_.findFirst({key: key});
        toRemove.remove({key: key});
        var row = immutableRow.unfreeze();
        row.setPos(pos++);
        row.set(me.origPk_, key);
        var outSrcPk = key;


        row.set(me.pk_, existingMapping.id);
        if (existingMapping.newPk) {
            outSrcPk = existingMapping.newPk;
            for (var i = 0; i < primaryColumns.length; i++) {
                var col = primaryColumns[i];
                row.set(col, existingMapping.newPk[i]);
            }
        }

        row.set(me.DUPLICATES, getDups(outSrcPk, existingMapping.id));
        res.addRow(row);

    });
    while (unsetPos < me.newDups_.length && me.newDups_[unsetPos].pos <= pos) {
        res.addRow(me.newDups_[unsetPos++].row);
    }

    // remove items that are not seen from pkMap

    toRemove.inOrderTraverse(function(v) {
        me.pkMap_.remove(v);
    });

    return res.freeze();

};

/**
 *
 * @param {!recoil.structs.table.Table} table
 * @param {!{table:!recoil.structs.table.Table}} sources
 * @return {!{table:!recoil.structs.table.Table}}
 */
recoil.structs.table.ImmutablePk.prototype.inverse = function(table, sources) {

    var dest = sources.table.createEmpty();
    var pkMap = new goog.structs.AvlTree(recoil.util.object.compareKey);
    var primaryColumns = sources.table.getPrimaryColumns();
    var otherColumns = sources.table.getOtherColumns();
    var me = this;
    var byKey = new goog.structs.AvlTree(recoil.util.object.compareKey);
    // first check for duplicates in the primary keys
    table.forEach(function(row, key) {
        var sourceKey = [];
        primaryColumns.forEach(function(col) {
            sourceKey.push(row.get(col));
        });

        var existing = byKey.findFirst({key: sourceKey});
        if (existing) {
            existing.rows.push(row);
        }
        else {
            byKey.add({key: sourceKey, rows: [row]});
        }
    });

    // we will add to an empty table that way we don't care about any loops
    // or updating the primary key to something that is temporarily a duplicate
    // only real duplicates are a problem
    var existingDups = {};
    var newDups = [];
    byKey.inOrderTraverse(function(val) {
        if (val.rows.length === 1) {
            dest.addRow(val.rows[0]);
            pkMap.add({key: val.key, id: val.rows[0].get(me.pk_)});
        }
        else {
            // we have duplicates there are 2 types
            // new rows and existing rows
            val.rows.forEach(function(row) {
                var origPk = row.get(me.origPk_);
                if (origPk === null) {
                    newDups.push({pos: row.pos(), row: row});

                }
                else {
                    // change everything appart from the key
                    var origRow = sources.table.getRow(origPk).unfreeze();
                    for (var i = 0; i < otherColumns.length; i++) {
                        var col = otherColumns[i];
                        origRow.setCell(col, row.getCell(col));
                    }
                    dest.addRow(origRow);
                    pkMap.add({key: origPk, id: row.get(me.pk_), newPk: val.key});
                }
            });

        }
    });
    this.newDups_ = newDups;
    this.pkMap_ = pkMap;
    return {table: dest.freeze()};
};
