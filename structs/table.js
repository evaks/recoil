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
goog.require('goog.math.Long');

/**
 * @template T
 * @param ?name
 * @constructor
 */
recoil.structs.table.ColumnKey = function(name) {
    this.name_ = name;
    this.id_ = String(recoil.structs.table.ColumnKey.nextId_); 
    recoil.structs.table.ColumnKey.nextId_ = recoil.structs.table.ColumnKey.nextId.add(goog.math.Long.ONE);
};

/**
 * @type goog.math.Long
 * @private
 */
recoil.structs.table.ColumnKey.nextId_ = goog.math.Long.ZERO;

/**
 *
 * @param {recoil.structs.table.ColumnKey} a
 * @param {recoil.structs.table.ColumnKey} b
 * @return !number
 */
recoil.structs.table.ColumnKey.comparator = function (a , b) {
    if (a.id_ < b.id_) {
        return -1;
    }
    if (a.id_ > b.id_) {
        return 1;
    }
    return 0;
};

//recoil.structs.table.Ta

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
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return recoil.structs.table.TableCell<CT>
 */
recoil.structs.table.TableRow.prototype.getCell = function (column) {
    return this.cells_[columnKey.id_];
};

/**
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return CT
 */

recoil.structs.table.TableRow.prototype.get = function (column) {
    return this.cells_[columnKey.id_].getValue();
};


/**
 * @brief a table row that can changed use this to make a row then
 * change it to a normal row
 * @constructor
 */
   
recoil.structs.table.MutableTableRow = function (opt_immutable) {
    this.orig_ = opt_immutable.cells_;
    this.changed_ = {};
};

/**
 * @template CT
 * @nosideeffects
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return recoil.structs.table.TableCell<CT>
 */

recoil.structs.table.MutableTableRow.prototype.getCell = function  (column) {
    if (this.changed_.hasOwnProperty(columnKey.id_)) {
	return this.changed_[columnKey.id_];
    }
    return this.orig_[columnKey.id_];
};

/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return CT
 */
recoil.structs.table.MutableTableRow.prototype.get = function (column) {
    return this.getCell(column).getValue();
};

/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {!recoil.structs.table.TableCell<CT>} val the data and meta data of the cell
 */

recoil.structs.table.TableRow.prototype.setCell = function (columnKey, val) {
    this.changed_[columnKey.id_] = val;
};

/**
 * 
 * @template T
 * @param {T} value
 * @param {object=} opt_meta
 * @constructor
 */

recoil.structs.table.TableCell = function (value, opt_meta) {
    this.value_ = value;
    this.meta_ = opt_meta;
};

/**
 * @nosideeffects
 * @return *
 */

recoil.structs.table.TableCell.prototype.getMeta = function () {
    return this.meta_;
};

/**
 * @nosideeffects
 * @return T
 */
recoil.structs.table.TableCell.prototype.getValue = function () {
    return this.value_;
};

/**
 * @brief returns a new cell with the meta data set
 * @nosideeffects
 * @param {*} meta
 * @return recoil.structs.table.TableCell<T>
 */
recoil.structs.table.TableCell.prototype.setMeta = function (meta) {
    return new recoil.structs.table.TableCell(this.value_, meta);
};

/**
 * @brief returns a new cell with the data set, keeps the metadata
 * @nosideeffects
 * @param {T} value
 * @return recoil.structs.table.TableCell<T>
 */

recoil.structs.table.TableCell.prototype.setValue = function (value) {
    return new recoil.structs.table.TableCell(value, this.meta_);
};
