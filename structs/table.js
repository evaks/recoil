goog.provide('recoil.structs.table.Table');

goog.provide('recoil.structs.table.ColumnKey');
goog.provide('recoil.structs.table.TableRow');
goog.provide('recoil.structs.table.TableCell');

goog.require('goog.structs.Collection');

/**
 *
 * @param {Array<ColumnKey>} columns
 * @template T
 * 
 */
recoil.structs.table.Table = function () {
    this.meta_ = {};
    this.columns_ = {};
    this.rows_ = [];
};

/**
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {number=} opt_index The index at which to insert the object. if ommited adds to the end of the 
 *       table
 */
recoil.structs.table.Table.prototype.addRow = function(row, opt_index) {
    if (opt_index === undefined) {
	this.rows_.push(row);
    }
    else {
	goog.array.insertAt(this.rows_, row, opt_index);
    }
};

/**
 *
 * @param {!number} index the index to remove
 * @return recoil.structs.table.TableRow<T>
 */ 
recoil.structs.table.Table.prototype.remove = function (index) {
    return goog.array.removeAt(this.rows_, index);
};

recoil.structs.table.Table.prototype.setRow = function (row, index) {
};


recoil.structs.table.Table.prototype.set = function (row, columnKey, index, value) {

};

recoil.structs.table.Table.prototype.rowMetaSet = function (row, columnKey, index, value) {

};
recoil.structs.table.Table.prototype.tableMetaSet = function (row, columnKey, index, value) {

};

recoil.structs.table.Table.prototype.get = function (row, columnKey, index) {
};


recoil.structs.table.Table.prototype.metaGet = function (row, columnKey, index) {
}


