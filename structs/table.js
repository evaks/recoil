goog.provide('recoil.structs.table.Table');
goog.provide('recoil.structs.table.MutableTable');
goog.provide('recoil.structs.table.TableRow');
goog.provide('recoil.structs.table.MutableTableRow');

// TODO mutable/immutable versions of table and rows
// a heirachy of rows
// changes function
// also in table widget factory produces widget, but we need a changed function
// have a primary key, but what happens if that can change?

goog.provide('recoil.structs.table.ColumnKey');
goog.provide('recoil.structs.table.TableRow');
goog.provide('recoil.structs.table.TableCell');

goog.require('goog.structs.Collection');


/**
 * @template T
 * @param name
 * @constructor
 */
recoil.structs.table.ColumnKey = function(name) {
    this.name_ = name;
};

/**
 *
 * @param {recoil.structs.table.ColumnKey} a
 * @param {recoil.structs.table.ColumnKey} b
 * @return !number
 */
recoil.structs.table.ColumnKey.comparator = function (a , b) {
    if (a.name_ < b.name_) {
        return -1;
    }
    if (a.name_ > b.name_) {
        return 1;
    }
    return 0;
};


/**
 *
 * @param {Array<ColumnKey>} columns
 * @template T
 * 
 */
recoil.structs.table.Table = function (columns) {
    this.meta_ = {};
    // a map of column keys to meta data
    this.columns_ = {};
    for (var i = 0; i < columns.length; i++) {
        this.columns_[columns[i].name_] = {};
    }
    this.rows_ = [];
};

recoil.structs.table.Table.comparator = function(a, b) {
    return recoil.structs.table.ColumnKey.comparator(a.key, b.key);
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
 * @return {boolean} True if an element was removed.
 */ 
recoil.structs.table.Table.prototype.remove = function (index) {
    return goog.array.removeAt(this.rows_, index);
};

/**
 *
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {!number} index the index to set
 */
recoil.structs.table.Table.prototype.setRow = function (row, index) {
    this.rows_[index] = row;
};

/**
 * @template CT
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {CT} value
 */
recoil.structs.table.Table.prototype.set = function (row, columnKey, value) {
    var old = this.rows_[row].getCell(columnKey);
    old.setValue(value);
};

/**
 * @template CT
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {CT} value
 */
recoil.structs.table.Table.prototype.rowMetaSet = function (row, columnKey, value) {
    var r = this.getRow(row);
    r.setMeta(value);
};

/**
 * @template CT
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {CT} value
 */
recoil.structs.table.Table.prototype.tableMetaSet = function (row, value) {
    this.meta_ = value;
};

/**
 * gets the value of a cell in the table, without the meta information
 * 
 * @template CT
 * @param {!number} row the index to get
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
2 */
recoil.structs.table.Table.prototype.get = function (row, columnKey) {
    var r = this.getRow(row);
    return r.getCell(columnKey);
};

/**
 * get cell value with its associated meta information
 *
 * @template CT
 * @param {!number} row
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
 * @return {object} an object containing the meta data and a value
 */
recoil.structs.table.Table.prototype.metaGet = function (row, columnKey) {
    var result = this.meta_.clone();
    var col = this.columns_.get(columnKey);
    var rowInfo = this.getRow(row);
    if (col) {
        goog.object.extend(result, col.meta);
    }
    if(rowInfo) {
        var cell = rowInfo.getCell(columnKey);
        goog.object.extend(result, rowInfo.getMeta());
        if (cell) {
            goog.object.extend(result, cell.getMeta());
            goog.object.set(result, "value", cell.getValue())
        }
    }
    return result;
};

/**
 * @template T
 * @constructor
 */
recoil.structs.table.TableRow = function() {
    this.cells_ = {};
};

/**
 * @template T
 * @param {T} columnKey
 * @return T
 */
recoil.structs.table.TableRow.prototype.getCell = function (columnKey) {
    return this.cells_[columnKey.name_];
};

recoil.structs.table.TableRow.prototype.setCell = function (columnKey, val) {
    this.cells_[columnKey.name_] = val;
};

/**
 * @template T
 * @param {T} value
 * @param {object=} opt_meta
 * @constructor
 */

recoil.structs.table.TableCell = function (value, opt_meta) {
    this.value_ = value;
    this.meta_ = opt_meta;
};

recoil.structs.table.TableCell.prototype.getMeta = function () {
    return this.meta_;
};

recoil.structs.table.TableCell.prototype.getValue = function () {
    return this.value_;
};

recoil.structs.table.TableCell.prototype.setMeta = function (meta) {
    this.meta_ = meta;
};

recoil.structs.table.TableCell.prototype.setValue = function (value) {
    this.value_ = value;

};
