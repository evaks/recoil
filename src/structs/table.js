goog.provide('recoil.structs.table.ColumnKey');
goog.provide('recoil.structs.table.MutableTable');
goog.provide('recoil.structs.table.MutableTableRow');
goog.provide('recoil.structs.table.Table');
goog.provide('recoil.structs.table.TableCell');
goog.provide('recoil.structs.table.TableRow');

// TODO mutable/immutable versions of table and rows
// a heirachy of rows
// changes function
// also in table widget factory produces widget, but we need a changed function
// have a primary key, but what happens if that can change?


goog.require('goog.array');
goog.require('goog.math.Long');
goog.require('goog.structs.AvlTree');
goog.require('goog.structs.Collection');
goog.require('recoil.util.Sequence');
goog.require('recoil.util.object');

/**
 * @template T
 * @constructor
 * @param {string} name
 * @param {function(T,T) : number=} opt_comparator used for key values only needed if > < = do not work and it is a primary key
 * @param {function(*) : T=} opt_castTo
 */
recoil.structs.table.ColumnKey = function(name, opt_comparator, opt_castTo) {
    this.name_ = name;
    this.comparator_ = opt_comparator || recoil.structs.table.ColumnKey.defaultComparator_;
    this.castTo_ = opt_castTo || function(x) {return x;};
    this.id_ = recoil.structs.table.ColumnKey.nextId_.next();
};

/**
 * @type recoil.util.Sequence
 * @private
 */
recoil.structs.table.ColumnKey.nextId_ = new recoil.util.Sequence();

/**
 * given the primary keys converts keys into a table, if there is more than
 * 1 primary key this requires keys to be an array
 * @param {!Array<!recoil.structs.table.ColumnKey>} primaryKeys
 * @param {!Array<?>} keys
 * @param {number=} opt_order
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.ColumnKey.normalizeColumns = function(primaryKeys, keys, opt_order) {
    var res = new recoil.structs.table.MutableTableRow(opt_order);

    if (primaryKeys.length !== keys.length) {
        throw 'incorrect number of primary keys';
    }
    else {
        for (var i = 0; i < primaryKeys.length; i++) {
            res.set(primaryKeys[i], primaryKeys[i].castTo(keys[i]));
        }
    }
    return res.freeze();
};

/**
 * @private
 * @param {*} a
 * @param {*} b
 * @return {number}
 */
recoil.structs.table.ColumnKey.defaultComparator_ = function(a, b) {
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
 * A default column key if none is provided they will be added sequentially
 * @type !recoil.structs.table.ColumnKey<!goog.math.Long>
 */
recoil.structs.table.ColumnKey.INDEX =
    new recoil.structs.table.ColumnKey(
        'index', undefined,
        function(x) {
            if (x instanceof goog.math.Long) {
                return x;
            }
            return goog.math.Long.fromNumber(parseInt(x, 10));
        });

/**
 * A default column that is used to store meta information for the row
 * @type !recoil.structs.table.ColumnKey<*>
 */
recoil.structs.table.ColumnKey.ROW_META = new recoil.structs.table. ColumnKey('meta', undefined, undefined);


/**
 * compares to values for column
 * @param {T} a
 * @param {T} b
 * @return {!number}
 */
recoil.structs.table.ColumnKey.prototype.compare = function(a, b) {
    return this.comparator_(a, b);
};

/**
 * @return {string}
 */
recoil.structs.table.ColumnKey.prototype.getId = function() {
    return this.toString();
};

/**
 * @return {string}
 */
recoil.structs.table.ColumnKey.prototype.toString = function() {
    return this.name_ === undefined ? this.id_ : this.name_ + ':' + this.id_;

};


/**
 * @param {*} a
 * @return {T}
 */
recoil.structs.table.ColumnKey.prototype.castTo = function(a) {
    return this.castTo_(a);
};

/**
 * @return {string}
 */
recoil.structs.table.ColumnKey.prototype.getName = function() {
    return this.name_ === undefined ? ('ID(' + this.id_ + ')') : this.name_;
};


/**
 *
 * @param {recoil.structs.table.ColumnKey} a
 * @param {recoil.structs.table.ColumnKey} b
 * @return {!number}
 */
recoil.structs.table.ColumnKey.comparator = function(a , b) {
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
 * construct a table which cannot change, provide a mutable table to get the value
 * @param {recoil.structs.table.MutableTable} table
 * @constructor
 */
recoil.structs.table.Table = function(table) {
    this.meta_ = {};

    goog.object.extend(this.meta_, table.meta_);
    this.columnMeta_ = {};
    goog.object.extend(this.columnMeta_, table.columnMeta_);

    this.primaryColumns_ = table.primaryColumns_;
    this.otherColumns_ = table.otherColumns_;
    this.rows_ = new goog.structs.AvlTree(table.rows_.comparator_);
    this.ordered_ = new goog.structs.AvlTree(recoil.structs.table.TableRow.positionComparator_(table.rows_.comparator_));
    var me = this;
    table.rows_.inOrderTraverse(function(x) {
        me.rows_.add(x);
        me.ordered_.add(x);
    });
};
/**
 * @return {Array<recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.Table.prototype.getPrimaryColumns = function() {
    return this.primaryColumns_;
};

/**
 * convert to a mutable table
 * @return {recoil.structs.table.MutableTable}
 */
recoil.structs.table.Table.prototype.unfreeze = function() {
    var res = new recoil.structs.table.MutableTable(this.primaryColumns_, this.otherColumns_);
    recoil.util.object.addProps(res.meta_, this.meta_);
    res.columnMeta_ = {};
    recoil.util.object.addProps(res.columnMeta_, this.columnMeta_);

    this.rows_.inOrderTraverse(function(row) {
        res.addRow(row);
    });
    return res;
};
/**
 *
 * @param {!Array<!recoil.structs.table.ColumnKey>} primaryKeys
 * @param {!Array<!recoil.structs.table.ColumnKey>} otherColumns
 * @constructor
 * @template T
 *
 */
recoil.structs.table.MutableTable = function(primaryKeys, otherColumns) {
    this.meta_ = {}; // table meta data
    this.columnMeta_ = {}; // column meta data

    if (primaryKeys.length === 0) {
        this.primaryColumns_ = [recoil.structs.table.ColumnKey.INDEX];
    }
    else {
        this.primaryColumns_ = goog.array.clone(primaryKeys);
    }
    this.otherColumns_ = goog.array.clone(otherColumns);
    var me = this;

    var comparator = function(rowA, rowB) {
        for (var key = 0; key < me.primaryColumns_.length; key++) {
            var col = me.primaryColumns_[key];
            var res = col.compare(rowA.get(col), rowB.get(col));
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    };

    this.rows_ = new goog.structs.AvlTree(comparator);
                                           //recoil.structs.table.TableRow.positionComparator_ = function (comparator) {
    this.ordered_ = new goog.structs.AvlTree(recoil.structs.table.TableRow.positionComparator_(comparator));

};


/**
 * gets the number of rows in the table
 * @return {!number}
 */
recoil.structs.table.MutableTable.prototype.size = function() {
    return this.rows_.getCount();
};
/**
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 */
recoil.structs.table.Table.comparator = function(a, b) {
    return recoil.structs.table.ColumnKey.comparator(a.key, b.key);
};

/**
 * set meta data to already existing meta data, this will replace all existing meta
 * data
 * @param {!Object} meta
 */

recoil.structs.table.MutableTable.prototype.setMeta = function(meta) {
    this.meta_ = goog.object.clone(meta);
};


/**
 * get table meta data
 * @return {!Object}
 */
recoil.structs.table.MutableTable.prototype.getMeta = function() {
    return this.meta_;
};

/**
 * add meta data to already existing meta data, this may override existing meta
 * data
 * @param {!Object} meta
 */

recoil.structs.table.MutableTable.prototype.addMeta = function(meta) {
    var newMeta = goog.object.clone(this.meta_);
    recoil.util.object.addProps(newMeta, this.meta_, meta);
    this.meta_ = goog.object.clone(newMeta);
};


/**
 * get column meta data
 * @param {recoil.structs.table.ColumnKey} key
 * @return {!Object}
 */

recoil.structs.table.MutableTable.prototype.getColumnMeta = function(key) {
    var res = this.columnMeta_[key];
    if (res === undefined) {
        return {};
    }

    return res;
};


/**
 * set new column meta data replacing already existing meta data there
 * if it is not overriden by the new meta data
 * @param {!recoil.structs.table.ColumnKey} key
 * @param {!Object} meta
 */

recoil.structs.table.MutableTable.prototype.setColumnMeta = function(key, meta) {
    this.columnMeta_[key] = goog.object.clone(meta);
};

/**
 * add new column meta data leaving already existing meta data there
 * if it is not overriden by the new meta data
 * @param {!recoil.structs.table.ColumnKey} key
 * @param {!Object} meta
 */
recoil.structs.table.MutableTable.prototype.addColumnMeta = function(key, meta) {
    var newMeta = goog.object.clone(this.getColumnMeta(key));

    for (var field in meta) {
        newMeta[field] = meta[field];
    }

    this.setColumnMeta(key, newMeta);
};


/**
 * get row meta data
 * @param {!Array<?>} keys
 * @return {!Object}
 */

recoil.structs.table.MutableTable.prototype.getRowMeta = function(keys) {
    var row = this.getRow(keys);

    if (row === null) {
        return {};
    }

    return row.getMeta();
};


/**
 * set new column meta data replacing already existing meta data there
 * if it is not overriden by the new meta data
 * @param {!Array<?>} keys
 * @param {!Object} meta
 */

recoil.structs.table.MutableTable.prototype.setRowMeta = function(keys, meta) {
    this.setCell(
        keys,
        recoil.structs.table.ColumnKey.ROW_META,
        new recoil.structs.table.TableCell(undefined, meta));
};

/**
 * add new column meta data leaving already existing meta data there
 * if it is not overriden by the new meta data
 * @param {!Array<*>} keys
 * @param {!Object} meta
 */
recoil.structs.table.MutableTable.prototype.addRowMeta = function(keys, meta) {
    var newMeta = {};
    recoil.util.object.addProps(newMeta, this.getRowMeta(keys), meta);

    this.setRowMeta(keys, newMeta);
};


/**
 * this uses the primary key of the row to insert the table
 *
 * @param {recoil.structs.table.TableRow<T> | recoil.structs.table.MutableTableRow<T>} row
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
            throw 'missing column: ' + col.getName();
        }
    });

    if (missingKeys.length === 1
        && this.primaryColumns_.length === 1
        && this.primaryColumns_[0] === recoil.structs.table.ColumnKey.INDEX) {
        var nextId;
        if (this.rows_.getCount() === 0) {
            nextId = goog.math.Long.getZero();
        }
        else {
            nextId = this.rows_.getMaximum().get(recoil.structs.table.ColumnKey.INDEX).add(goog.math.Long.getOne());
        }
        row = row.set(recoil.structs.table.ColumnKey.INDEX, nextId);
    }
    else if (missingKeys.length > 0) {
        throw 'Must specify All primary keys';
    }

    var tblRow = row.keepColumns(goog.array.concat(this.primaryColumns_, this.otherColumns_));
    if (this.rows_.findFirst(tblRow) !== null) {
        throw 'row already exists ';
    }
    this.rows_.add(tblRow);
    this.ordered_.add(tblRow);
};
/**
 * @private
 * @param {Array<*>} keys
 * @return {recoil.structs.table.TableRow} the key as a row so it can be used to lookup the value in the map

 */
recoil.structs.table.MutableTable.prototype.makeKeys_ = function(keys) {
    if (keys.length !== this.primaryColumns_.length) {
        throw 'Incorrect number of primary keys';
    }
    var row = new recoil.structs.table.MutableTableRow();
    for (var i = 0; i < keys.length; i++) {
        row.set(this.primaryColumns_[i], keys[i]);
    }

    return row.freeze();
};

/**
 *
 * @param {function(recoil.structs.table.TableRow,Array<*>,Object) : *} func
 */
recoil.structs.table.MutableTable.prototype.forEach = function(func) {
    var me = this;
    var list = [];
    //construct a list first just incase we modify the
    //table while iterating over it

    this.ordered_.inOrderTraverse(function(row) {
        list.push(row);
    });

    list.forEach(function(row) {
        var keys = [];

        for (var i = 0; i < me.primaryColumns_.length; i++) {
            keys.push(row.get(me.primaryColumns_[i]));
        }
        return func(row, keys, row.getMeta());
    });
    //var table = this.freeze();
    //table.forEach(func);
};

/**
 * this uses the primary key of the row to insert the table
 *
 * @param {Array<*>} keys
 *
 */
recoil.structs.table.MutableTable.prototype.removeRow = function(keys) {
    var oldRow = this.rows_.remove(this.makeKeys_(keys));
    if (oldRow === null) {
        throw 'Row does not exist';
    }
    else {
        this.ordered_.remove(oldRow);
    }
};

/**
 * gets the row from a table, pass the primary keys as an array of values
 * @param {!Array<?>} keys
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.MutableTable.prototype.getRow = function(keys) {
    var keyRow = recoil.structs.table.ColumnKey.normalizeColumns(this.primaryColumns_, keys);
    return this.rows_.findFirst(keyRow);
};

/**
 * Sets the value for the cell
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} value
 */
recoil.structs.table.MutableTable.prototype.set = function(keys, column, value) {
    var old = this.getCell(keys, column);

    if (old === null) {
        throw 'Cell Does not exist';
    }
    this.setCell(keys, column, old.setValue(value));
};

/**
 * Sets the value and meta data for the cell
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} value
 */
recoil.structs.table.MutableTable.prototype.setCell = function(keys, column, value) {

     var row = this.getRow(keys);

     if (row === null) {
         throw 'row not found';
     }

     this.removeRow(keys);
     this.addRow(row.setCell(column, value));


 };

/**
 * sets only the cell meta data, leave the value unchanged
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {!Object} meta
 */
recoil.structs.table.MutableTable.prototype.setCellMeta = function(keys, column, meta) {
    var cell = this.getCell(keys, column);
    if (cell === null) {
        console.log("settin null");
    }
    this.setCell(keys, column, cell.setMeta(meta));
};

/**
 * adds meta data to the cell
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {!Object} meta
 */
recoil.structs.table.MutableTable.prototype.addCellMeta = function(keys, column, meta) {
    var cell = this.getCell(keys, column);
    var newMeta = recoil.util.object.clone(cell.getMeta());
    recoil.util.object.addProps(newMeta, meta);
    this.setCell(keys, column, cell.setMeta(meta));
};

/**
 * Sets the value and meta data for the cell
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.TableRow} row
 */

recoil.structs.table.MutableTable.prototype.setRow = function(keys, row) {
     var oldRow = this.getRow(keys);

     if (oldRow === null) {
         throw 'row not found';
     }

     this.removeRow(keys);
     this.addRow(row);


 };

/**
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {recoil.structs.table.TableCell<CT>}
 */
recoil.structs.table.MutableTable.prototype.getCell = function(keys, column) {
    var row = this.getRow(keys);
    if (row === null) {
        return null;
    }
    return row.getCell(column);
};

/**
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {CT}
 */
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

recoil.structs.table.MutableTable.prototype.freeze = function() {
    return new recoil.structs.table.Table(this);
};

/**
 * gets the value of a cell in the table, without the meta information
 * @template CT
 * @param {!Array<?>} keys primary key of the row
 * @param {recoil.structs.table.ColumnKey<CT>} columnKey
 * @return {CT}
 */
recoil.structs.table.Table.prototype.get = function(keys, columnKey) {
    var r = this.getRow(keys);
    if (r == null) {
        return null;
    }
    return r.get(columnKey);
};

/**
 * @return {!Object}
 */
recoil.structs.table.Table.prototype.getMeta = function() {
    return this.meta_;
};

/**
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {*} +
 */
recoil.structs.table.Table.prototype.getColumnMeta = function(column) {
    var res = this.columnMeta_[column];
    if (res === undefined) {
        return {};
    }

    return res;
};


/**
 * @template CT
 * @param {!Array<?>} keys
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {!Object}
 */
recoil.structs.table.Table.prototype.getRowMeta = function(keys, column) {
    var row = this.getRow(keys);

    if (row === null) {
        return {};
    }

    return row.getMeta();
};


/**
 *
 * @param {function(!recoil.structs.table.TableRow, Array<?>, Object) : *} func
 */

recoil.structs.table.Table.prototype.forEach = function(func) {
    var me = this;
    this.ordered_.inOrderTraverse(function(row) {
        var keys = [];
        for (var i = 0; i < me.primaryColumns_.length; i++) {
            keys.push(row.get(me.primaryColumns_[i]));
        }
        return func(row, keys, row.getMeta());
    });
};


/**
 * @return {!Array<!recoil.structs.table.ColumnKey<*>>}
 */
recoil.structs.table.Table.prototype.getKeyColumns = function() {
    return this.primaryColumns_;
};

/**
 * @return {!Array<!recoil.structs.table.ColumnKey<*>>}
 */
recoil.structs.table.Table.prototype.getColumns = function() {
    return goog.array.concat(this.primaryColumns_, this.otherColumns_);
};

/**
 * this ensures the sort order
 *
 * @param {function(recoil.structs.table.ColumnKey,Object) : *} func
 */

recoil.structs.table.Table.prototype.forEachPlacedColumn = function(func) {
    var cols = [];
    var me = this;
    var addCol = function(key) {
        var col = me.columnMeta_[key.getId()];
        if (col && col.position !== undefined) {
            cols.push({meta: col, key: key});
        }
    };
    this.primaryColumns_.forEach(addCol);
    this.otherColumns_.forEach(addCol);
    goog.array.sort(cols, function(x, y) {
        return x.meta.position - y.meta.position;
    });

    cols.forEach(function(col) {
        func(col.key, col.meta);
    });
};

/**
 * gets the number of rows in the table
 * @return {!number}
 */
recoil.structs.table.Table.prototype.size = function() {
    return this.rows_.getCount();
};

/**
 * gets the row from a table, pass the primary keys as an array of values
 * @param {!Array<?>} keys
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
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @return {recoil.structs.table.TableCell<CT>} an object containing the meta data and a value
 */
recoil.structs.table.Table.prototype.getCell = function(keys, columnKey) {
    var rowInfo = this.getRow(keys);

    if (rowInfo) {
        return rowInfo.getCell(columnKey);
    }
    return null;
};


/**
 *
 * @param {Object} typeFactories
 * @param {Object} tableMeta
 * @param {Array<Object>} rawTable
 * @param {boolean} opt_ordered if true then it will enforce the order it rawtable came in
 * @return {recoil.structs.table.Table}
 */
recoil.structs.table.Table.create = function(typeFactories, tableMeta, rawTable, opt_ordered) {

    var keys = recoil.structs.table.Table.extractKeys_(tableMeta);
    console.log(keys);
    var tbl = new recoil.structs.table.MutableTable(keys.primaryKeys, keys.otherKeys);

    tbl.setMeta({'typeFactories': typeFactories});

    for (var tMeta in tableMeta) {
        var colKey = tableMeta[tMeta].key;
        tbl.setColumnMeta(colKey, tableMeta[tMeta]);
    }

    var i = 0;
    rawTable.forEach(function(item) {
        var row = new recoil.structs.table.MutableTableRow(opt_ordered === true ? i : undefined);

        for (var tMeta in tableMeta) {
            var colKey = tableMeta[tMeta].key;
            row.set(colKey, item[tMeta]);
        }
        tbl.addRow(row);
        i++;

    });
    console.log(tbl.freeze());
   return tbl.freeze();
};

/**
 *
 * @param {Object} tableMeta
 * @return {Object}
 * @private
 */
recoil.structs.table.Table.extractKeys_ = function(tableMeta) {
    var primaryKeys = [];
    var otherKeys = [];

    for (var obj in tableMeta) {
        if (tableMeta.hasOwnProperty(obj)) {
            var val = tableMeta[obj];
            if (val.hasOwnProperty('primary')) {
                primaryKeys.push(val);
            }
            else {
                otherKeys.push(val.key);
            }
        }
    }
    /**
     * @suppress {missingProperties}
     * @param {?} a
     * @param {?} b
     * @return {number}
     */
    var comp = function(a, b) {
        return a.primary - b.primary;
    };

    primaryKeys.sort(comp);


    return {primaryKeys: recoil.structs.table.Table.getColumnKeys_(primaryKeys),
            otherKeys: otherKeys};
};

/**
 * @private
 * @param {Array<Object>} array
 * @return {!Array<!recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.Table.getColumnKeys_ = function(array) {
    var res = [];

    for (var i = 0; i < array.length; i++) {
        res.push(array[i].key);
    }
    return res;
};

/**
 * @param {!recoil.structs.table.MutableTableRow=} opt_tableRow
 * @constructor
 */
recoil.structs.table.TableRow = function(opt_tableRow) {
    this.cells_ = {};
    this.pos_ = undefined;
    if (opt_tableRow !== undefined) {
        for (var key in opt_tableRow.orig_) {
            this.cells_[key] = opt_tableRow.orig_[key];
        }

        for (var key in opt_tableRow.changed_) {
            this.cells_[key] = opt_tableRow.changed_[key];
        }
        this.pos_ = opt_tableRow.pos();
    }
};


/**
 * @private
 * @param {function (!recoil.structs.table.TableRow, !recoil.structs.table.TableRow):number}  comparator
 * @return {function (!recoil.structs.table.TableRow, !recoil.structs.table.TableRow):number}
 */
recoil.structs.table.TableRow.positionComparator_ = function(comparator) {
    return function(x, y) {
        if (x.pos() === undefined && y.pos() === undefined) {
            return comparator(x, y);
        }
        if (x.pos() === undefined || y.pos() === undefined) {
            return x.pos() === undefined ? -1 : 1;
        }

        var res = x.pos() - y.pos();
        if (res === 0) {
            return comparator(x, y);
        }
        return res;
    };
};

/**
 * @return {number|undefined}
 */
recoil.structs.table.TableRow.prototype.pos = function() {
    return this.pos_;
};
/**
 * Get the value and meta data from the cell
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {recoil.structs.table.TableCell<CT>}
 */
recoil.structs.table.TableRow.prototype.getCell = function(column) {
    var res = this.cells_[column];
    return res === undefined ? null : res;
};


/**
 * Get the value and meta data from the cell
 * @template CT
 * @return {!Object}
 */
recoil.structs.table.TableRow.prototype.getMeta = function() {
    var res = this.cells_[recoil.structs.table.ColumnKey.ROW_META];
    return res === undefined ? {} : res.getMeta();
};




/**
 * Gets only the value from the cell
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {CT}
 */

recoil.structs.table.TableRow.prototype.get = function(column) {
    var val = this.cells_[column];
    return val === undefined ? null : val.getValue();
};

/**
 * sets the cell and returns a new row, this row is unmodified
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} value
 * @return {!recoil.structs.table.TableRow}
 */

recoil.structs.table.TableRow.prototype.set = function(column, value) {
    var mutable = new recoil.structs.table.MutableTableRow(this.pos(), this);
    mutable.set(column, value);
    return mutable.freeze();
};


/**
 * sets the cell and returns a new row, this row is unmodified
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {!recoil.structs.table.TableCell<CT>} value
 * @return {recoil.structs.table.TableRow}
 */

recoil.structs.table.TableRow.prototype.setCell = function(column, value) {
    var mutable = new recoil.structs.table.MutableTableRow(this.pos(), this);
    mutable.setCell(column, value);
    return mutable.freeze();
};

/**
 * @param {...*} var_args
 * @return {recoil.structs.table.MutableTableRow}
 */
recoil.structs.table.TableRow.create = function(var_args) {
    var mutableRow = new recoil.structs.table.MutableTableRow();
    for (var i = 0; i < arguments.length; i += 2) {
        mutableRow.set(arguments[i], arguments[i + 1]);
    }

    return mutableRow;
};


/**
 * @param {number} pos the position of the row
 * @param {...*} var_args
 * @return {recoil.structs.table.MutableTableRow}
 */
recoil.structs.table.TableRow.createOrdered = function(pos, var_args) {
    var mutableRow = new recoil.structs.table.MutableTableRow(pos);
    for (var i = 0; i < arguments.length; i += 2) {
        mutableRow.set(arguments[i], arguments[i + 1]);
    }

    return mutableRow;
};

/**
 * @return {!Object}
 */
recoil.structs.table.TableRow.prototype.getRowMeta = function() {
    var cell = this.getCell(recoil.structs.table.ColumnKey.ROW_META);
    return cell.getMeta();
};

/**
 * removes all columsn not in the columns parameter
 * @param {Array<!recoil.structs.table.ColumnKey>} columns
 * @return {!recoil.structs.table.TableRow}
 */

recoil.structs.table.TableRow.prototype.keepColumns = function(columns) {
    var mutable = new recoil.structs.table.MutableTableRow(this.pos_);
    var me = this;
    columns.forEach(function(col) {
        if (me.hasColumn(col)) {
            var val = me.getCell(col);
            if (val !== null) {
                mutable.setCell(col, val);
            }
        }
    });
    if (me.hasColumn(recoil.structs.table.ColumnKey.ROW_META)) {
        mutable.setRowMeta(me.getRowMeta());
    }
    return mutable.freeze();
};

/**
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {CT}
 */

recoil.structs.table.TableRow.prototype.hasColumn = function(column) {
    return this.cells_[column] !== undefined;
};

/**
 * A table row that can be changed. Use this to make a row then
 * change it to a normal row
 * @constructor
 * @param {number=} opt_position if the row is order specify this
 * @param {recoil.structs.table.TableRow=} opt_immutable
 */

recoil.structs.table.MutableTableRow = function(opt_position, opt_immutable) {
    if (opt_immutable) {
        this.orig_ = opt_immutable.cells_;
        this.pos_ = opt_position === undefined ? opt_immutable.pos() : opt_position;
    }
    else {
        this.orig_ = {};
        this.pos_ = opt_position === undefined ? undefined : opt_position;
    }
    this.changed_ = {};
};

/**
 * @return {number|undefined}
 */
recoil.structs.table.MutableTableRow.prototype.pos = function() {
    return this.pos_;
};

/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {recoil.structs.table.TableCell<CT>}
 */

recoil.structs.table.MutableTableRow.prototype.getCell = function(column) {
    if (this.changed_.hasOwnProperty(column)) {
        return this.changed_[column];
    }
    var res = this.orig_[column];
    if (res === undefined) {
        return null;
    }
    return this.orig_[column];
};
/**
 * @param {!Object} meta
 */
recoil.structs.table.MutableTableRow.prototype.setRowMeta = function(meta) {
    var cell = this.getCell(recoil.structs.table.ColumnKey.ROW_META);
    if (cell == null) {
        cell = new recoil.structs.table.TableCell(undefined, {});
    }
    this.setCell(recoil.structs.table.ColumnKey.ROW_META, cell.setMeta(meta));
};
/**
 * @return {!Object}
 */
recoil.structs.table.MutableTableRow.prototype.getRowMeta = function() {
    var cell = this.getCell(recoil.structs.table.ColumnKey.ROW_META);
    return cell.getMeta();
};

/**
 * converts a mutable table row to immutable table row
 * @return {!recoil.structs.table.TableRow}
 */

recoil.structs.table.MutableTableRow.prototype.freeze = function() {
    return new recoil.structs.table.TableRow(this);
};
/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {CT}
 */
recoil.structs.table.MutableTableRow.prototype.get = function(column) {
    var res = this.getCell(column);
    return res === null ? null : res.getValue();
};

/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {!recoil.structs.table.TableCell<CT>} val the data and meta data of the cell
 */

recoil.structs.table.MutableTableRow.prototype.setCell = function(columnKey, val) {
    this.changed_[columnKey] = val;
};


/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {CT} val the data of the cell
 */

recoil.structs.table.MutableTableRow.prototype.set = function(columnKey, val) {
    var old = this.getCell(columnKey);
    if (old === null) {
        old = new recoil.structs.table.TableCell(undefined);
    }

    this.setCell(columnKey, old.setValue(columnKey.castTo(val)));
};
/**
 *
 * @template T
 * @param {T} value
 * @param {!Object=} opt_meta
 * @constructor
 */

recoil.structs.table.TableCell = function(value, opt_meta) {
    this.value_ = value;
    this.meta_ = opt_meta;
};

/**
 * @return {!Object}
 */

recoil.structs.table.TableCell.prototype.getMeta = function() {
    return this.meta_ === undefined ? {} : this.meta_;
};

/**
 * @return {T}
 */
recoil.structs.table.TableCell.prototype.getValue = function() {
    return this.value_;
};

/**
 * returns a new cell with the meta data set
 * @param {!Object} meta
 * @return {!recoil.structs.table.TableCell<T>}
 */
recoil.structs.table.TableCell.prototype.setMeta = function(meta) {
    return new recoil.structs.table.TableCell(this.value_, meta);
};

/**
 * returns a new cell with the data set, keeps the metadata
 * @param {T} value
 * @return {!recoil.structs.table.TableCell<T>}
 */

recoil.structs.table.TableCell.prototype.setValue = function(value) {
    return new recoil.structs.table.TableCell(value, this.meta_);
};
