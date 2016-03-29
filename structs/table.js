goog.provide('recoil.structs.table.Table');
goog.provide('recoil.structs.table.MutableTable');
goog.provide('recoil.structs.table.TableRow');
goog.provide('recoil.structs.table.MutableTableRow');
goog.provide('recoil.structs.table.ColumnKey');
goog.provide('recoil.structs.table.TableCell');

// TODO mutable/immutable versions of table and rows
// a heirachy of rows
// changes function
// also in table widget factory produces widget, but we need a changed function
// have a primary key, but what happens if that can change?


goog.require('goog.structs.Collection');
goog.require('goog.math.Long');
goog.require('goog.array');
goog.require('goog.structs.AvlTree');
goog.require('recoil.util.Sequence');

/**
 * @template T
 * @param {string} name
 * @param {?function(T,T) : number} opt_compartor used for key values only needed if > < = do not work and it is a primary key
 * @constructor
 */
recoil.structs.table.ColumnKey = function(name, opt_comparator) {
    this.name_ = name;
    this.comparator_ = opt_comparator || recoil.structs.table.ColumnKey.defaultComparator_;
    this.id_ = recoil.structs.table.ColumnKey.nextId_.next(); 
};
/**
 * @type goog.math.Long
 * @private
 */
recoil.structs.table.ColumnKey.nextId_ = new recoil.util.Sequence();

/**
 *@private
 */
recoil.structs.table.ColumnKey.defaultComparator_ = function (a, b) {
    if (a === b) {
	return 0;
    }
    if (a === null) {
	return -1;
    }
    if (b === null) {
	return 1;
    }
    if (a === undefined) {
	return -1;
    }
    if (b === undefined) {
	return 1;
    }
    
    if (typeof(a) !== typeof(b)) {
	return typeof(a) < typeof(b) ? -1 : 1;
    }
    if (a < b) {
	return -1;
    }
    if (b < a) {
	return 1;
    }
    return 0;
};

/**
 * @brief a default column key if none is provided they will be added
 * sequentually
 * @type recoil.structs.table.ColumnKey<goog.math.Long>
 */
recoil.structs.table.ColumnKey.INDEX = new recoil.structs.table. ColumnKey("index");

/**
 * @param {T} a 
 * @param {T} b
 */
recoil.structs.table.ColumnKey.prototype.compare = function(a,b) {
    return this.comparator_(a,b);
}

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
 * @brief construct a table with cannot change, provide a mutable table 
 * to get the value
 * @param {recoil.structs.table.MutableTable} table
 *
 */
recoil.structs.table.Table = function (table) {
    this.meta_ = table.meta_;
    this.primaryColumns_ = table.primaryColumns_;
    this.otherColumns_ = table.otherColumns_;
    this.rows_ = table.rows_;
};

/**
 *
 * @param {Array<ColumnKey>} primaryKeys
 * @param {Array<ColumnKey>} otherColumns
 * @template T
 * 
 */
recoil.structs.table.MutableTable = function (primaryKeys, otherColumns) {
    this.meta_ = {};
    
    if (primaryKeys.length === 0) {
	this.primaryColumns_ = [recoil.structs.table.ColumnKey.INDEX];
    }
    else {
	this.primaryColumns_ = goog.array.clone(primaryKeys);
    }
    this.otherColumns_ = goog.array.clone(otherColumns);
    var me = this;
    this.rows_ = new goog.structs.AvlTree(function(rowA, rowB) {
	for (var key in me.primaryColumns_) {
	    var col = me.primaryColumns[key];
	    var res = col.compare(rowA.get(col), rowB.get(col));
	    if (res !== 0) {
		return res;
	    }
	}
	return 0;
    }); 
};

recoil.structs.table.Table.comparator = function(a, b) {
    return recoil.structs.table.ColumnKey.comparator(a.key, b.key);
};

/**
 * @param {recoil.structs.table.TableRow<T>} row
 * @param {number=} opt_index The index at which to insert the object. if ommited adds to the end of the 
 *       table
 */
recoil.structs.table.MutableTable.prototype.addRow = function(row, opt_index) {
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
    this.orig_ = opt_immutable ? opt_immutable.cells_ : {};
    this.changed_ = {};
};

/**
 * @template CT
 * @nosideeffects
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return recoil.structs.table.TableCell<CT>
 */

recoil.structs.table.MutableTableRow.prototype.getCell = function  (column) {
    if (this.changed_.hasOwnProperty(column.id_)) {
	return this.changed_[column.id_];
    }
    var res = this.orig_[column.id_];
    if (res === undefined) {
	return new recoil.structs.table.TableCell(undefined);
    }
    return this.orig_[column.id_];
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

recoil.structs.table.MutableTableRow.prototype.setCell = function (columnKey, val) {
    this.changed_[columnKey.id_] = val;
};


/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} val the data of the cell
 */

recoil.structs.table.MutableTableRow.prototype.set = function (columnKey, val) {
    this.setCell(this.getCell(columnKey).setValue(val));
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
