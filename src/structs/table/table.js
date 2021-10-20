goog.provide('recoil.structs.table.ColumnKey');
goog.provide('recoil.structs.table.MutableTable');
goog.provide('recoil.structs.table.MutableTableRow');
goog.provide('recoil.structs.table.Table');
goog.provide('recoil.structs.table.TableCell');
goog.provide('recoil.structs.table.TableInterface');
goog.provide('recoil.structs.table.TableRow');
goog.provide('recoil.structs.table.TableRowInterface');

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
 * @interface
 */
recoil.structs.table.TableInterface = function() {};

/**
 * this ensures the sort order, the parameters to the function are columnkey and column meta data
 *
 * @param {function(!recoil.structs.table.ColumnKey,!Object) : *} func
 */

recoil.structs.table.TableInterface.prototype.forEachPlacedColumn = function(func) {};


/**
 * @interface
 */
recoil.structs.table.TableRowInterface = function() {};


/**
 * Gets only the value from the cell
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {CT}
 */

recoil.structs.table.TableRowInterface.prototype.get = function(column) {};

/**
 * @param {function(string,!recoil.structs.table.TableCell)} func
 */
recoil.structs.table.TableRowInterface.prototype.forEachColumn = function(func) {};

/**
 * Get the value and meta data from the cell
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {recoil.structs.table.TableCell<CT>}
 */
recoil.structs.table.TableRowInterface.prototype.getCell = function(column) {};

/**
 * @template T
 * @constructor
 * @param {string} name
 * @param {function(T,T) : number=} opt_comparator used for key values only needed if > < = do not work and it is a primary key
 * @param {function(*) : T=} opt_castTo
 * @param {T=} opt_default
 * @param {function():T=} opt_defaultFunc
 */
recoil.structs.table.ColumnKey = function(name, opt_comparator, opt_castTo, opt_default, opt_defaultFunc) {
    this.name_ = name;
    this.comparator_ = opt_comparator || recoil.structs.table.ColumnKey.defaultComparator_;
    this.castTo_ = opt_castTo || function(x) {return x;};
    this.hasDefault_ = arguments.length > 3;
    this.default_ = opt_default;
    this.defaultFunc_ = opt_defaultFunc;
    this.id_ = recoil.structs.table.ColumnKey.nextId_.next();
};

/**
 * @param {string} name
 * @return {!recoil.structs.table.ColumnKey<string>}
 */
recoil.structs.table.ColumnKey.createUnique = function(name) {
    var seq = new recoil.util.Sequence();
    return new recoil.structs.table.ColumnKey(name, undefined, undefined, '', function() {
        return seq.next();
    });
};
/**
 * this function can be used to make 2 primary keys have
 * the same default function, this can be useful if you want
 * to have primary keys to be unique between accross to keys
 *
 * note this should really be called only once and before the column is
 * used to generate any primary keys
 *
 * @param {!recoil.structs.table.ColumnKey} otherKey
 */
recoil.structs.table.ColumnKey.prototype.setSameDefaultFunc = function(otherKey)  {
    if (goog.isFunction(this.defaultFunc_)) {
        otherKey.defaultFunc_ = this.defaultFunc_;
        otherKey.hasDefault_ = true;
        return;
    }
    throw new Error(this + ' does not have a default function');
};
/**
 * @return {T}
 */
recoil.structs.table.ColumnKey.prototype.getDefault = function() {
    if (goog.isFunction(this.defaultFunc_)) {
        return this.defaultFunc_();
    }
    return this.default_;
};

/**
 * @return {!recoil.structs.table.ColumnKey}
 */
recoil.structs.table.ColumnKey.prototype.clone = function() {
    return this;
};
/**
 * @return {boolean}
 */
recoil.structs.table.ColumnKey.prototype.hasDefault = function() {
    return this.hasDefault_;
};

/**
 * @type {!recoil.util.Sequence}
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
 * @type {!recoil.structs.table.ColumnKey<!goog.math.Long>}
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
 * @type {!recoil.structs.table.ColumnKey<*>}
 */
recoil.structs.table.ColumnKey.ROW_META = new recoil.structs.table. ColumnKey('meta', undefined, undefined);


/**
 * compares to values for column
 * @param {T} a
 * @param {T} b
 * @return {number}
 */
recoil.structs.table.ColumnKey.prototype.valCompare = function(a, b) {
    return this.comparator_(a, b);
};

/**
 * compares to values for column
 * @param {T} a
 * @return {number|undefined}
 */
recoil.structs.table.ColumnKey.prototype.compare = function(a) {
    if (a instanceof recoil.structs.table.CombinedColumnKey) {
        return -a.compare(this);
    }
    if (a instanceof recoil.structs.table.ColumnKey) {
        return this.id_ - a.id_;
    }
    return undefined;
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
 * @return {number}
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


/**
 * @template T
 * @extends {recoil.structs.table.ColumnKey}
 * @param {!Array<recoil.structs.table.ColumnKey>} columnKeys
 * @constructor
 **/
recoil.structs.table.CombinedColumnKey = function(columnKeys) {
    this.name_ = columnKeys.map(function(c) {return c.getName();}).join(',');
    this.subKeys_ = columnKeys;
};


/**
 * not implemented for combined keys set the column keys to be the same
 * @param {!recoil.structs.table.ColumnKey} otherKey
 */
recoil.structs.table.CombinedColumnKey.prototype.setSameDefaultFunc = function(otherKey)  {
    throw new Error('not supported fro combined keys');
};
/**
 * @return {T}
 */
recoil.structs.table.CombinedColumnKey.prototype.getDefault = function() {
    return this.subKeys_.map(function(c) {return c.getDefault();});
};

/**
 * @return {!recoil.structs.table.ColumnKey}
 */
recoil.structs.table.CombinedColumnKey.prototype.clone = function() {
    return this;
};
/**
 * @return {boolean}
 */
recoil.structs.table.CombinedColumnKey.prototype.hasDefault = function() {
    return this.subKeys_.reduce(function(acc, v) {return acc && v;},true);
};


/**
 * compares to values for column
 * @param {T} a
 * @param {T} b
 * @return {number}
 */
recoil.structs.table.CombinedColumnKey.prototype.valCompare = function(a, b) {
    if (a instanceof Array && b instanceof Array) {
        if (a.length === this.subKeys_.length && b.length === this.subKeys_.length) {
            for (var i = 0; i < this.subKeys_.length; i++) {
                var res = this.subKeys_[i].valCompare(a[i], b[i]);
                if (res !== 0) {
                    return res;
                }
            }
            return 0;
        }
    }
    return recoil.util.object.compare(a, b);
};

/**
 * compares to values for column
 * @param {T} a
 * @return {number|undefined}
 */
recoil.structs.table.CombinedColumnKey.prototype.compare = function(a) {
    if (a instanceof recoil.structs.table.CombinedColumnKey) {
        var res = this.subKeys_.length - a.subKeys_.length;
        if (res !== 0) {
            return res;
        }
        for (var i = 0; i < this.subKeys_.length; i++) {
            res = this.subKeys_[i].compare(a.subKeys_[i]);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    }
    if (a instanceof recoil.structs.table.ColumnKey) {
        return -1;
    }
    return undefined;
};

/**
 * @return {string}
 */
recoil.structs.table.CombinedColumnKey.prototype.equals = function() {
    return this.toString();
};


/**
 * @return {string}
 */
recoil.structs.table.CombinedColumnKey.prototype.getId = function() {
    return this.toString();
};

/**
 * @return {string}
 */
recoil.structs.table.CombinedColumnKey.prototype.toString = function() {
    return '[' + this.subKeys_.map(function(c) {return c.toString();}).join(',') + ']';
};


/**
 * @param {*} a
 * @return {T}
 */
recoil.structs.table.CombinedColumnKey.prototype.castTo = function(a) {
    var res = [];
    for (var i = 0; i < this.subKeys_.length; i++) {
        res.push(this.subKeys_[i].castTo(a[i]));
    }
    return res;
};

/**
 * @return {string}
 */
recoil.structs.table.CombinedColumnKey.prototype.getName = function() {
    return this.name_;
};

/**
 * construct a table which cannot change, provide a mutable table to get the value
 * @param {recoil.structs.table.MutableTable} table
 * @constructor
 * @implements {recoil.structs.table.TableInterface}
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
 * very efficent way of setting the meta on a table
 * it doesn't change this table but returns an new table
 * with new meta
 * @param {!Object} meta
 * @return {!recoil.structs.table.Table}
 */
recoil.structs.table.Table.prototype.addMeta = function(meta) {
    var res = new recoil.structs.table.Table(new recoil.structs.table.MutableTable(this.primaryColumns_, this.otherColumns_));
    res.meta_ = goog.object.clone(this.meta_);
    recoil.util.object.addProps(res.meta_, meta);
    res.columnMeta_ = this.columnMeta_;
    res.rows_ = this.rows_;
    res.ordered_ = this.ordered_;
    return res;
};

/**
 * @param {?} b
 * @return {number}
 */
recoil.structs.table.Table.prototype.compare = function(b) {
    if (b instanceof recoil.structs.table.Table) {
        var res = this.size() - b.size();
        if (res !== 0) {
            return res;
        }
        res = recoil.util.object.compareAll([
            {x: this.getMeta(), y: b.getMeta()},
            {x: this.primaryColumns_, y: b.primaryColumns_},
            {x: this.otherColumns_, y: b.otherColumns_},
            {x: this.ordered_, y: b.ordered_}]
        );
        if (res !== 0) {
            return res;
        }
        //ok we don't compare lengths since we already compared the primary and other columns
        //however it might be good if we ignore order of other columns
        var cols = this.getColumns();
        for (var i = 0; i < cols.length; i++) {
            var col = cols[i];
            res = recoil.util.object.compare(this.getColumnMeta(col), b.getColumnMeta(col));
            if (res !== 0) {
                return res;
            }
        }

        return 0;
    }
    return -1;
};

/**
 * @param {?} a
 * @return {boolean}
 */
recoil.structs.table.Table.prototype.equals = function(a) {
    return this.compare(a) === 0;
};
/**
 * @return {!Array<!recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.Table.prototype.getPrimaryColumns = function() {
    return this.primaryColumns_;
};

/**
 * @return {!Array<!recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.Table.prototype.getOtherColumns = function() {
    return this.otherColumns_;
};

/**
 * convert to a mutable table
 * @return {!recoil.structs.table.MutableTable}
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
 * creates an empty mutable table with the same columns
 * @param {IArrayLike<!recoil.structs.table.ColumnKey>} cols
 * @return {!recoil.structs.table.MutableTable}
 */
recoil.structs.table.Table.prototype.createEmptyKeep = function(cols) {
    var remove = [];
    var seen = {};
    cols.forEach(function(col) {
        seen[col.getId()] = true;
    });
    this.otherColumns_.forEach(function(c) {
        if (!seen[c.getId()]) {
            remove.push(c);
        }
    });


    return this.createEmpty([], [], remove);
};

/**
 * creates an empty mutable table with the same columns
 * @param {IArrayLike<!recoil.structs.table.ColumnKey>=} opt_extPrimaryCols
 * @param {IArrayLike<!recoil.structs.table.ColumnKey>=} opt_extOtherCols
 * @param {IArrayLike<!recoil.structs.table.ColumnKey>=} opt_removeCols
 * @return {!recoil.structs.table.MutableTable}
 */
recoil.structs.table.Table.prototype.createEmpty = function(opt_extPrimaryCols, opt_extOtherCols, opt_removeCols) {
    var newPrimary = this.primaryColumns_.concat(opt_extPrimaryCols || []);
    var seen = {};
    var newOther = [];
    // don't add already existing columns
    this.otherColumns_.forEach(function(c) {
        seen[c.getId()] = true;
        newOther.push(c);
    });
    if (opt_extOtherCols) {
        opt_extOtherCols.forEach(function(c) {
            if (!seen[c.getId()]) {
                newOther.push(c);
            }
        });
    }
    var removeMap = {};
    if (opt_removeCols) {
        opt_removeCols.forEach(function(c) {
            removeMap[c] = true;
        });
    }

    var doRemove = function(arr) {
        for (var i = arr.length - 1; i >= 0; i--) {
            if (removeMap[arr[i]]) {
                arr.splice(i, 1);
            }
        }
    };
    if (opt_removeCols) {
        doRemove(newPrimary);
        doRemove(newOther);
    }
    var res = new recoil.structs.table.MutableTable(newPrimary,
                                                    newOther);

    recoil.util.object.addProps(res.meta_, this.meta_);
    res.columnMeta_ = {};
    recoil.util.object.addProps(res.columnMeta_, this.columnMeta_);
    if (opt_removeCols) {
        opt_removeCols.forEach(function(col) {
            delete res.columnMeta_[col];
        });
    }

    return res;
};



/**
 * creates an empty mutable table based on a table, that will a have all original columns
 * but the primary keys will be the ones specified
 * @param {!Array<!recoil.structs.table.ColumnKey>} primaryCols the new primary keys these can be new or existing
 * @param {!Array<!recoil.structs.table.ColumnKey>} extOtherCols any extra columns that need to be added that are
 *                                                                    not primary keys
 * @return {!recoil.structs.table.MutableTable}
 */
recoil.structs.table.Table.prototype.createEmptyAddCols = function(primaryCols, extOtherCols) {
    var otherColumns = [];
    var me = this;
    this.primaryColumns_.forEach(function(val) {
        if (!goog.array.contains(primaryCols, val)) {
            otherColumns.push(val);
        }
    });
    this.otherColumns_.forEach(function(val) {
        if (!goog.array.contains(primaryCols, val)) {
            otherColumns.push(val);
        }
    });

    extOtherCols.forEach(function(val) {
        if (!goog.array.contains(otherColumns, val)) {
            otherColumns.push(val);
        }
    });

    var res = new recoil.structs.table.MutableTable(primaryCols, otherColumns);
    recoil.util.object.addProps(res.meta_, this.meta_);
    res.columnMeta_ = {};
    recoil.util.object.addProps(res.columnMeta_, this.columnMeta_);
    return res;
};

/**
 * given that this table has primary key that is a number
 * it will generate a mutable table row with a primary key not aready in the table
 * also if all the existing rows have an position then the position of the new row will
 * be the last row
 *
 * @param {!recoil.structs.table.MutableTable|!recoil.structs.table.MutableTable} table
 *
 * @return {!recoil.structs.table.MutableTableRow}
 */
recoil.structs.table.Table.createUniqueIntPkRow = function(table) {
    var primaryCols = table.getPrimaryColumns();
    if (primaryCols.length !== 1) {
        throw 'to generate pk you must have exactly 1 primary key';
    }
    var res = new recoil.structs.table.MutableTableRow();
    var pos = 0;
    var usedPks = new goog.structs.AvlTree();

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
    res.set(primaryCols[0], curPk);
    res.setPos(pos);
    return res;
};
/**
 *
 * @param {!Array<!recoil.structs.table.ColumnKey>} primaryKeys
 * @param {!Array<!recoil.structs.table.ColumnKey>} otherColumns
 * @constructor
 * @implements {recoil.structs.table.TableInterface}
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
            var res = col.valCompare(rowA.get(col), rowB.get(col));
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
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.MutableTable.prototype.getFirstRow = function() {
    var res = null;
    this.forEach(function(row) {
        if (!res) {
            res = row;
        }
    });
    return res;
};


/**
 * @return {!Array<!recoil.structs.table.ColumnKey<*>>}
 */
recoil.structs.table.MutableTable.prototype.getColumns = function() {
    return goog.array.concat(this.primaryColumns_, this.otherColumns_);
};

/**
 * @return {?} a more readable version of the table
 */
recoil.structs.table.MutableTable.prototype.toDebugObj = function() {
    var tableOut = [];
    var behaviour = this;
    this.forEach(function(row) {
        tableOut.push(row);
    });
    return {meta: this.meta_, colMeta: this.columnMeta_, tbl: tableOut};
};

/**
 * @return {!Array<!recoil.structs.table.ColumnKey<*>>}
 */
recoil.structs.table.MutableTable.prototype.getPrimaryColumns = function() {
    return this.primaryColumns_;
};

/**
 * @return {!Array<!recoil.structs.table.ColumnKey>}
 */
recoil.structs.table.MutableTable.prototype.getOtherColumns = function() {
    return this.otherColumns_;
};


/**
 * this ensures the sort order, the parameters to the function are columnkey and column meta data
 *
 * @param {function(!recoil.structs.table.ColumnKey,!Object) : *} func
 */

recoil.structs.table.MutableTable.prototype.forEachPlacedColumn = function(func) {
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
 * @param {function(!recoil.structs.table.ColumnKey,!Object) : *} func
 */

recoil.structs.table.MutableTable.prototype.forEachColumn = function(func) {
    var cols = [];
    var me = this;
    var addCol = function(key) {
        var col = me.columnMeta_[key.getId()];
        cols.push({meta: col, key: key});
    };
    this.primaryColumns_.forEach(addCol);
    this.otherColumns_.forEach(addCol);

    cols.forEach(function(col) {
         if (col.key !== recoil.structs.table.ColumnKey.ROW_META) {
             func(col.key, col.meta || {});
        }

        func(col.key, col.meta);
    });
};

/**
 * @param {!recoil.structs.table.MutableTableRow|recoil.structs.table.TableRow} row
 * @return {!Array<?>}
 */
recoil.structs.table.MutableTable.prototype.getRowKey = function(row) {
    var res = [];
    for (var i = 0; i < this.primaryColumns_.length; i++) {
        res.push(row.get(this.primaryColumns_[i]));
    }
    return res;
};



/**
 * gets the number of rows in the table
 * @return {number}
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
 * @param {!Object|{position:number}} meta
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
            if (col.hasDefault()) {
                row = row.set(col, col.getDefault());
            }
            else {
                missingKeys.push(col);
            }
        }
    });
    this.otherColumns_.forEach(function(col) {
        if (!row.hasColumn(col)) {
            if (col.hasDefault()) {
                row = row.set(col, col.getDefault());
            }
            else {
                throw new Error('missing column: ' + col.getName());
            }
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
        throw new Error('row already exists ');
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
 * returns an array of keys for the row
 * @param {!recoil.structs.table.TableRow} row
 * @return {!Array<?>}
 */
recoil.structs.table.MutableTable.prototype.getRowKeys = function(row) {
    var keys = [];

    for (var i = 0; i < this.primaryColumns_.length; i++) {
        keys.push(row.get(this.primaryColumns_[i]));
    }
    return keys;
};

/**
 *
 * @param {function(!recoil.structs.table.TableRow,!Array<?>,Object) : *} func the first parametr is the row the, second is \
 *    the primary key, and the third is the rowMeta data
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
        return func(row, me.getRowKeys(row), row.getMeta());
    });
    //var table = this.freeze();
    //table.forEach(func);
};


/**
 * like foreach but makes the row mutable, this is done often
 * @param {function(!recoil.structs.table.MutableTableRow,!Array<?>,Object) : *} func the first parametr is the row the, second is \
 *    the primary key, and the third is the rowMeta data
 */
recoil.structs.table.MutableTable.prototype.forEachModify = function(func) {
    var me = this;
    var list = [];
    //construct a list first just incase we modify the
    //table while iterating over it

    this.ordered_.inOrderTraverse(function(row) {
        list.push(row.unfreeze());
    });

    list.forEach(function(row) {
        return func(row, me.getRowKeys(row), row.getMeta());
    });
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
 * gets the row from a table, pass the primary keys as an array of values
 * @param {function(!recoil.structs.table.TableRow):boolean} compare
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.MutableTable.prototype.findRow = function(compare) {
    let res = null;

    this.forEach(function(row) {
        if (compare(row)) {
            res = row;
        }
    });
    return res;
};

/**
 * Sets the value for the cell
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @param {CT} value
 * @param {Object=} opt_meta
 */
recoil.structs.table.MutableTable.prototype.set = function(keys, column, value, opt_meta) {
    var old = this.getCell(keys, column);

    if (old === null) {
        throw 'Cell Does not exist';
    }
    if (opt_meta) {
        this.setCell(keys, column, new recoil.structs.table.TableCell(value, opt_meta));
    }
    else {
        this.setCell(keys, column, old.setValue(value));
    }
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
        console.log('settin null');
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
    var newMeta = cell.getMeta();
    recoil.util.object.addProps(newMeta, meta);
    this.setCell(keys, column, cell.setMeta(meta));
};

/**
 * Sets the value and meta data for the cell
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.TableRow|!recoil.structs.table.MutableTableRow} row
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
 * @return {!recoil.structs.table.Table}
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
    return recoil.util.object.clone(this.meta_);
};

/**
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} column
 * @return {!Object} +
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
 * returns an array of keys for the row
 * @param {!recoil.structs.table.TableRow|!recoil.structs.table.MutableTableRow} row
 * @return {!Array<?>}
 */
recoil.structs.table.Table.prototype.getRowKeys = function(row) {
    var keys = [];

    for (var i = 0; i < this.primaryColumns_.length; i++) {
        keys.push(row.get(this.primaryColumns_[i]));
    }
    return keys;
};

/**
 *
 * @param {function(!recoil.structs.table.TableRow, !Array<?>, Object) : *} func
 */

recoil.structs.table.Table.prototype.forEach = function(func) {
    var me = this;
    this.ordered_.inOrderTraverse(function(row) {
        return func(row, me.getRowKeys(row), row.getMeta());
    });
};


/**
 *
 * @param {function(!recoil.structs.table.MutableTableRow, !Array<?>, Object) : *} func
 */

recoil.structs.table.Table.prototype.forEachModify = function(func) {
    var me = this;
    this.ordered_.inOrderTraverse(function(row) {
        return func(row.unfreeze(), me.getRowKeys(row), row.getMeta());
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
 * this ensures the sort order, the parameters to the function are columnkey and column meta data
 *
 * @param {function(!recoil.structs.table.ColumnKey,!Object) : *} func
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
 * @return {?} a more readable version
 */
recoil.structs.table.Table.prototype.toDebugObj = function() {
    var tableOut = [];
    var behaviour = this;
    this.forEach(function(row) {
        tableOut.push(row);
    });
    return {meta: this.meta_, colMeta: this.columnMeta_, tbl: tableOut};
};

/**
 * @param {function(!recoil.structs.table.ColumnKey,!Object) : *} func
 */

recoil.structs.table.Table.prototype.forEachColumn = function(func) {
    var cols = [];
    var me = this;
    var addCol = function(key) {
        var col = me.columnMeta_[key.getId()];
        cols.push({meta: col, key: key});
    };
    this.primaryColumns_.forEach(addCol);
    this.otherColumns_.forEach(addCol);

    cols.forEach(function(col) {
        func(col.key, col.meta || {});
    });
};

/**
 * gets the number of rows in the table
 * @return {number}
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
 * gets the row from a table, pass the primary keys as an array of values
 * @param {function(!recoil.structs.table.TableRow):boolean} compare
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.Table.prototype.findRow = function(compare) {
    let res = null;

    this.forEach(function(row) {
        if (compare(row)) {
            res = row;
        }
    });
    return res;
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
 * gets the cell meta including the column, table and row values
 * @template CT
 * @param {!Array<?>} keys
 * @param {!recoil.structs.table.ColumnKey<CT>} col
 * @return {!Object}
 */
recoil.structs.table.Table.prototype.getFullCellMeta = function(keys, col) {
    var row = this.getRow(keys);
    if (row) {
        var meta = {};
        goog.object.extend(meta, this.getMeta(),
                           row.getRowMeta(),
                           this.getColumnMeta(col), row.getCellMeta(col));
        return meta;
    }
    return this.getMeta();
};



/**
 * @return {recoil.structs.table.TableRow}
 */
recoil.structs.table.Table.prototype.getFirstRow = function() {
    var res = null;
    this.forEach(function(row) {
        if (!res) {
            res = row;
        }
    });
    return res;
};

/**
 *
 * @param {Object} typeFactories
 * @param {Object} tableMeta
 * @param {Array<Object>} rawTable
 * @param {boolean=} opt_ordered if true then it will enforce the order it rawtable came in
 * @return {recoil.structs.table.Table}
 */
recoil.structs.table.Table.create = function(typeFactories, tableMeta, rawTable, opt_ordered) {

    var keys = recoil.structs.table.Table.extractKeys_(tableMeta);
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
 * @implements {recoil.structs.table.TableRowInterface}
 */
recoil.structs.table.TableRow = function(opt_tableRow) {
    this.cells_ = {};
    this.cells_[recoil.structs.table.ColumnKey.ROW_META] = new recoil.structs.table.TableCell(undefined, {});
    this.pos_ = undefined;
    if (opt_tableRow !== undefined) {
        for (var key in opt_tableRow.orig_) {
            this.cells_[key] = opt_tableRow.orig_[key];
        }

        for (key in opt_tableRow.changed_) {
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
 * checks to see if the values are equal ignoring meta data
 * @param {?} that
 * @return {boolean}
 */
recoil.structs.table.TableRow.prototype.valuesEqual = function(that) {
    if (!(that instanceof recoil.structs.table.TableRow)) {
        return false;
    }
    var equal = true;
    var me = this;
    this.forEachColumn(function(col, cell) {
        if (!that.cells_.hasOwnProperty(col) || !that.cells_[col]) {
            equal = false;
            return true;
        }
        if (!recoil.util.object.isEqual(cell.getValue(), that.cells_[col].getValue())) {
            equal = false;
            return true;
        }
        return false;
    });

    that.forEachColumn(function(col, cell) {
        if (!me.cells_.hasOwnProperty(col)) {
            equal = false;
            return true;
        }
        return false;
    });
    return equal;
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
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {recoil.structs.table.TableCell<CT>}
 */
recoil.structs.table.TableRow.prototype.getCell = function(column) {
    var res = this.cells_[column];
    return res === undefined ? null : res;
};

/**
 * Get the value and meta data from the cell
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {!Object}
 */
recoil.structs.table.TableRow.prototype.getCellMeta = function(column) {
    var res = this.getCell(column);
    return res ? res.getMeta() : {};
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
 * @param {function(string,!recoil.structs.table.TableCell)} func
 */
recoil.structs.table.TableRow.prototype.forEachColumn = function(func) {
    var metaCol = recoil.structs.table.ColumnKey.ROW_META.toString();
    for (var col in this.cells_) {
        if (metaCol !== col) {
            if (func(col, this.cells_[col])) {
                return;
            }
        }
    }
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
    return cell ? cell.getMeta() : {};
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
 * @return {!recoil.structs.table.MutableTableRow}
 */
recoil.structs.table.TableRow.prototype.unfreeze = function() {
    return new recoil.structs.table.MutableTableRow(undefined, this);
};
/**
 * A table row that can be changed. Use this to make a row then
 * change it to a normal row
 * @constructor
 * @implements {recoil.structs.table.TableRowInterface}
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
 * Get the value and meta data from the cell
 * @template CT
 * @return {!Object}
 */
recoil.structs.table.MutableTableRow.prototype.getMeta = function() {
    return this.getRowMeta();
};

/**
 * @param {function(string,!recoil.structs.table.TableCell)} func
 * if the function returns true the loop exist
 */
recoil.structs.table.MutableTableRow.prototype.forEachColumn = function(func) {
    var metaCol = recoil.structs.table.ColumnKey.ROW_META.toString();
    for (var col in this.changed_) {
        if (metaCol !== col) {
            if (func(col, this.changed_[col])) {
                return;
            }
        }
    }
    for (col in this.orig_) {
        if (metaCol !== col && !this.changed_[col]) {
            if (func(col, this.orig_[col])) {
                return;
            }
        }
    }
};
/**
 * @param {!recoil.structs.table.TableRowInterface} row
 */
recoil.structs.table.MutableTableRow.prototype.addColumns = function(row) {
    var me = this;
    row.forEachColumn(function(col, cell) {
        me.changed_[col] = cell;
    });
};
/**
 * @param {?} that
 * @return {boolean}
 */
recoil.structs.table.MutableTableRow.prototype.equals = function(that) {
    if (!(that instanceof recoil.structs.table.MutableTableRow)) {
        return false;
    }

    return recoil.util.object.isEqual(this.freeze(), that.freeze());
};

/**
 * checks to see if the values are equal ignoring meta data
 * @param {?} that
 * @return {boolean}
 */
recoil.structs.table.MutableTableRow.prototype.valuesEqual = function(that) {
    if (!(that instanceof recoil.structs.table.MutableTableRow)) {
        return false;
    }

    return this.freeze().valuesEqual(that.freeze());
};

/**
 * @return {number|undefined}
 */
recoil.structs.table.MutableTableRow.prototype.pos = function() {
    return this.pos_;
};


/**
 * @param {number|undefined} pos
 */
recoil.structs.table.MutableTableRow.prototype.setPos = function(pos) {
    this.pos_ = pos;
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
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} column
 * @return {!Object}
 */

recoil.structs.table.MutableTableRow.prototype.getCellMeta = function(column) {
    var res = this.getCell(column);
    return res ? res.getMeta() : {};
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
 * @param {!Object} meta
 */
recoil.structs.table.MutableTableRow.prototype.addRowMeta = function(meta) {
    var newMeta = {};
    recoil.util.object.addProps(newMeta, this.getRowMeta(), meta);
    this.setRowMeta(newMeta);
};
/**
 * @return {!Object}
 */
recoil.structs.table.MutableTableRow.prototype.getRowMeta = function() {
    var cell = this.getCell(recoil.structs.table.ColumnKey.ROW_META);
    return cell ? cell.getMeta() : {};
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
 * a helper that just transfers the columns from the source rows
 * into this row
 * @param {!Array<!recoil.structs.table.ColumnKey>} columnKeys
 * @param {!recoil.structs.table.TableRowInterface} src
 */
recoil.structs.table.MutableTableRow.prototype.transfer = function(columnKeys, src) {
    for (var i = 0; i < columnKeys.length; i++) {
        var col = columnKeys[i];
        this.set(col, src.get(col));
    }
};
/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {CT} val the data of the cell
 * @param {Object=} opt_meta
 */

recoil.structs.table.MutableTableRow.prototype.set = function(columnKey, val, opt_meta) {
    var old = this.getCell(columnKey);
    if (old === null) {
        old = new recoil.structs.table.TableCell(undefined);
    }
    if (opt_meta) {
        this.setCell(columnKey, new recoil.structs.table.TableCell(
            columnKey.castTo(val), opt_meta));
    }
    else {
        this.setCell(columnKey, old.setValue(columnKey.castTo(val)));
    }
};

/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {!Object} val the data of the cell
 */

recoil.structs.table.MutableTableRow.prototype.setCellMeta = function(columnKey, val) {
    var old = this.getCell(columnKey);
    if (old === null) {
        old = new recoil.structs.table.TableCell(undefined);
    }

    this.setCell(columnKey, old.setMeta(val));
};
/**
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} columnKey
 * @param {!Object} val the data of the cell
 */

recoil.structs.table.MutableTableRow.prototype.addCellMeta = function(columnKey, val) {
    var old = this.getCell(columnKey);
    if (old === null) {
        old = new recoil.structs.table.TableCell(undefined);
    }

    this.setCell(columnKey, old.addMeta(val));
};
/**
 *
 * @template T
 * @param {T} value
 * @param {Object=} opt_meta
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
    return !this.meta_ ? {} : goog.object.clone(this.meta_);
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
 * returns a new cell with the meta data set
 * @param {!Object} meta
 * @return {!recoil.structs.table.TableCell<T>}
 */
recoil.structs.table.TableCell.prototype.addMeta = function(meta) {
    var newMeta = goog.object.clone(this.getMeta());
    recoil.util.object.addProps(newMeta, meta);
    return new recoil.structs.table.TableCell(this.value_, newMeta);
};

/**
 * returns a new cell with the data set, keeps the metadata
 * @param {T} value
 * @return {!recoil.structs.table.TableCell<T>}
 */

recoil.structs.table.TableCell.prototype.setValue = function(value) {
    return new recoil.structs.table.TableCell(value, this.meta_);
};
