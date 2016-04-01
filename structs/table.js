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
recoil.structs.table.ColumnKey = function(name, opt_comparator, opt_castTo) {
    this.name_ = name;
    this.comparator_ = opt_comparator || recoil.structs.table.ColumnKey.defaultComparator_;
    this.castTo_ = opt_castTo || function(x) {return x;}
    this.id_ = recoil.structs.table.ColumnKey.nextId_.next(); 
};
/**
 * @type goog.math.Long
 * @private
 */
recoil.structs.table.ColumnKey.nextId_ = new recoil.util.Sequence();

/**
 * given the primary keys converts keys into a table, if there is more than
 * 1 primary key this requires keys to be an array
 * @param {Array<recoil.structs.table.ColumnKey>} primaryKeys
 * @param {Array<*>|*}
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.ColumnKey.normalizeColumns = function (primaryKeys, keys) {
    var res = new recoil.structs.table.MutableTableRow();

    if (primaryKeys.length !== keys.length)  {
	throw "incorrect number of primary keys";
    }
    else {
	for (var i = 0; i < primaryKeys.length; i++ ) {
	    res.set(primaryKeys[i], primaryKeys[i].castTo(keys[i]));
	}
    }
    return res.freeze();
};
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
recoil.structs.table.ColumnKey.INDEX = new recoil.structs.table. ColumnKey("index", undefined,
									   function(x) {
									       if (x instanceof goog.math.Long) {
										   return x;
									       }
									       return goog.math.Long.fromNumber(x);
									   });

/**
 * @param {T} a 
 * @param {T} b
 */
recoil.structs.table.ColumnKey.prototype.compare = function(a,b) {
    return this.comparator_(a,b);
};


/**
 * @param {*} a 
 * @return {T}
 */
recoil.structs.table.ColumnKey.prototype.castTo = function(a) {
    return this.castTo_(a);
};

recoil.structs.table.ColumnKey.prototype.getName = function() {
    return this.name_ === undefined ? ("ID(" + this.id_ + ")") : name;
};


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
	    var col = me.primaryColumns_[key];
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
 * this uses the primary key of the row to insert the table
 * 
 * @param {recoil.structs.table.TableRow<T> | recoil.structs.table.MutableTableRow<T>} row
 *
 */
recoil.structs.table.MutableTable.prototype.addRow = function(row) {
    var missingKeys = [];
    if (row instanceof recoil.structs.table.MutableTableRow) {
	row = row.freeze();
    }
    this.primaryColumns_.forEach(function(col) {
	if (!row.hasColumn(col)) {
	    missingKeys.push(col);
	}
    });
    this.otherColumns_.forEach(function(col) {
	if (!row.hasColumn(col)) {
	    throw "missing column" + col.getName();
	}
    });

    

    if (missingKeys.length === 1
	&& this.primaryColumns_.length === 1
	&& this.primaryColumns_[0] === recoil.structs.table.ColumnKey.INDEX) {
	var nextId;
	if (this.rows_.getCount() === 0) {
	    nextId = goog.math.Long.ZERO;
	}
	else {
	    nextId = this.rows_.getMaximum().get(recoil.structs.table.ColumnKey.INDEX).add(goog.math.Long.ONE);
	}
	row = row.set(recoil.structs.table.ColumnKey.INDEX,nextId);
    }	
    else if (missingKeys.length > 0) {
	throw "Must sepecify All primary keys";
    }

    this.rows_.add(row.keepColumns(goog.array.concat(this.primaryColumns_, this.otherColumns_)));
};
/**
 * gets the row from a table, pass the primary keys as an array of values
 * @param {Array<*>}
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.MutableTable.prototype.getRow = function(keys) {
    var keyRow = recoil.structs.table.ColumnKey.normalizeColumns(this.primaryColumns_, keys);
    return this.rows_.findFirst(keyRow);
};



recoil.structs.table.MutableTable.prototype.getCell = function(keys, column) {
    var row = this.getRow(keys);
    if (row === null) {
	return null;
    }
    return row.getCell(column);
};



recoil.structs.table.MutableTable.prototype.get = function(keys, column) {
    var row = this.getRow(keys);
    if (row === null) {
	return null;
    }
    return row.get(column);
};

/**
 * convert into immutable table
 * @return {recoil.structs.table.Table}
 */

recoil.structs.table.MutableTable.prototype.freeze = function () {
    return  new recoil.structs.table.Table(this);
};

/**
 * gets the value of a cell in the table, without the meta information
 * @nosideeffects
 * @template CT
 * @param {Array<*>} keys primary key of the row
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
 */
recoil.structs.table.Table.prototype.get = function (keys, columnKey) {
    var r = this.getRow(keys);
    if (r == null) {
	return null;
    }
    return r.get(columnKey);
};


/**
 * gets the row from a table, pass the primary keys as an array of values
 * @param {Array<*>}
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.Table.prototype.getRow = function(keys) {
    var keyRow = recoil.structs.table.ColumnKey.normalizeColumns(this.primaryColumns_, keys);
    return this.rows_.findFirst(keyRow);
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
 * @param {?recoil.structs.table.MutableTable} opt_tableRow
 * @constructor
 */
recoil.structs.table.TableRow = function(opt_tableRow) {
    this.cells_ = {};
    if (opt_tableRow !== undefined) {
	for (var key in opt_tableRow.orig_) {
	    this.cells_[key] = opt_tableRow.orig_[key];
	};

	for (var key in opt_tableRow.changed_) {
	    this.cells_[key] = opt_tableRow.changed_[key];
	};
    }
};

/**
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return recoil.structs.table.TableCell<CT>
 */
recoil.structs.table.TableRow.prototype.getCell = function (column) {
    var res  =  this.cells_[column.id_];
    return res === undefined ? null : res;
};



/**
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return CT
 */

recoil.structs.table.TableRow.prototype.get = function (column) {
    var val = this.cells_[column.id_];
    return val === undefined ? null : val.getValue();
};

/**
 * sets the cell and returns a new row, this row is unmodified
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} value
 * @return {recoil.structs.table.TableRow}
 */

recoil.structs.table.TableRow.prototype.set = function (column, value) {
    var mutable = new recoil.structs.table.MutableTableRow(this);
    mutable.set(column, value);
    return mutable.freeze();
};


/**
 * removes all columsn not in the columns parameter
 * @nosideeffects
 * @param {Arra<recoil.structs.table.ColumnKey>} column
 * @return recoil.structs.table.TableRow
 */

recoil.structs.table.TableRow.prototype.keepColumns = function (columns) {
    var mutable = new recoil.structs.table.MutableTableRow();
    var me = this;
    columns.forEach (function (col) {
	if (me.hasColumn(col)) {
	    mutable.setCell(col, me.getCell(col));
	}
    });
    return mutable.freeze();
};


/**
 * @template CT
 * @nosideeffects
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return CT
 */

recoil.structs.table.TableRow.prototype.hasColumn = function (column) {
    return this.cells_[column.id_] !== undefined;
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
	return null;
    }
    return this.orig_[column.id_];
};

/**
 * converts a mutable table row to imutable table row
 * @nosideeffects
 * @return {recoil.structs.table.TableRow}
 */
 
recoil.structs.table.MutableTableRow.prototype.freeze = function () {
    return new recoil.structs.table.TableRow(this);
}; 
/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return CT
 */
recoil.structs.table.MutableTableRow.prototype.get = function (column) {
    var res = this.getCell(column);
    return res === null ? null : res.getValue();
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
    var old = this.getCell(columnKey);
    if (old === null) {
	old = new recoil.structs.table.TableCell(undefined);
    }

    this.setCell(columnKey, old.setValue(val));
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
