goog.provide('recoil.structs.table.UniqKeyGenerator');

/**
 * a class that given a table that has only has 1 integer primary key
 * will generate primary keys, not for a mutable table it does not check to
 * see if the table has changed, so all new keys should be added via this class
 * @constructor
 * @param {!recoil.structs.table.Table|!recoil.structs.table.MutableTable} table
 */

recoil.structs.table.UniqKeyGenerator = function(table) {
    var primaryCols = table.getPrimaryColumns();
    if (primaryCols.length !== 1) {
        throw 'to generate pk you must have exactly 1 primary key';
    }
    var usedPks = new goog.structs.AvlTree();
    var pos = 0;
    table.forEach(function(row, key) {
        if (pos !== undefined) {
            var rowPos = row.pos();
            if (rowPos === undefined) {
                pos = undefined;
            }
            else if (pos < rowPos) {
                pos = rowPos + 1;
            }
        }
        if (typeof(key[0]) !== 'number') {
            throw 'cannot generate primary key on non number field';
        }
        usedPks.add(key[0]);
    });
    var curPk = 0;
    usedPks.inOrderTraverse(function(val) {
        if (curPk < val) {
            return true;
        }
        if (curPk === val) {
            curPk++;
        }
        return false;
    });
    this.usedPks_ = usedPks;
    this.curPk_ = curPk;
};

/**
 * @return {!number}
 */
recoil.structs.table.UniqKeyGenerator.prototype.nextPk = function() {
    var res = this.curPk_;
    this.usedPks_.add(res);

    var curPk = this.curPk_ + 1;
    this.usedPks_.inOrderTraverse(function(val) {
        if (curPk < val) {
            return true;
        }
        if (curPk === val) {
            curPk++;
        }
        return false;
    }, curPk);

    this.curPk_ = curPk;
    return res;
};
