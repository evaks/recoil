goog.provide('recoil.db.Query');
goog.provide('recoil.db.QueryExp');
goog.provide('recoil.db.QueryOptions');
goog.provide('recoil.db.QueryScope');
goog.provide('recoil.db.expr.And');
goog.provide('recoil.db.expr.Equals');
goog.provide('recoil.db.expr.Exists');
goog.provide('recoil.db.expr.Field');
goog.provide('recoil.db.expr.GreaterThan');
goog.provide('recoil.db.expr.GreaterThanOrEquals');
goog.provide('recoil.db.expr.In');
goog.provide('recoil.db.expr.LessThan');
goog.provide('recoil.db.expr.LessThanOrEquals');
goog.provide('recoil.db.expr.Not');
goog.provide('recoil.db.expr.NotEquals');
goog.provide('recoil.db.expr.NotIn');
goog.provide('recoil.db.expr.Or');
goog.provide('recoil.db.expr.RexExp');
goog.provide('recoil.db.expr.True');
goog.provide('recoil.db.expr.Value');
goog.provide('recoil.db.expr.Where');

goog.require('goog.array');
goog.require('goog.string');
goog.require('recoil.db.Escaper');
goog.require('recoil.structs.table.ColumnKey');

/**
 * @interface
 */
recoil.db.QueryHelper = function() {};

/**
 * @return {string}
 */
recoil.db.QueryHelper.prototype.true = function() {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.and = function(x, y) {};


/**
 * @param {!Array<string>} values
 * @return {string}
 */
recoil.db.QueryHelper.prototype.concat = function(values) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.or = function(x, y) {};


/**
 * @param {string} x
 * @return {string}
 */
recoil.db.QueryHelper.prototype.not = function(x) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.notEquals = function(x, y) {};


/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.equals = function(x, y) {};


/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.startsWith = function(x, y) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.containsStr = function(x, y) {};



/**
 * @param {!recoil.db.QueryScope} scope
 * @param {!Array<string>} path
 * @return {string}
 */
recoil.db.QueryHelper.prototype.field = function(scope, path) {};


/**
 * @param {string} value
 * @param {!Array<string>} list
 * @return {string}
 */
recoil.db.QueryHelper.prototype.in = function(value, list) {};

/**
 * @param {string} value
 * @param {!Array<string>} list
 * @return {string}
 */
recoil.db.QueryHelper.prototype.notIn = function(value, list) {};


/**
 * @param {string} value
 * @param {boolean} exists
 * @return {string}
 */
recoil.db.QueryHelper.prototype.exists = function(value, exists) {};




/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.lessThanOrEqual = function(x, y) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.lessThan = function(x, y) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.greaterThanOrEqual = function(x, y) {};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.QueryHelper.prototype.greaterThan = function(x, y) {};


/**
 * @implements {recoil.db.QueryHelper}
 * @constructor
 * @param {!recoil.db.Escaper} escaper
 */
recoil.db.SQLQueryHelper = function(escaper) {
    this.escaper_ = escaper;
};


/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.and = function(x, y) {
    return '(' + x + ' AND ' + y + ')';
};


/**
 * @param {!Array<string>} values
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.concat = function(values) {
    return 'concat(' + values.join(',') + ')';
};


/**
 * @param {string} value
 * @param {!Array<string>} list
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.in = function(value, list) {
    if (list.length === 0) {
        return '(1=2)';
    }
    return '(' + value + ' IN (' + list.join(', ') + '))';
};

/**
 * @param {recoil.db.QueryScope} scope
 * @param {string} value
 * @param {!Array<string>} list
 * @param {boolean} all
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.contains = function(scope, value, list, all) {
    if (list.length === 0) {
        return '(1=1)';
    }
    var col = function(t, col) {
        return t + '.' + col;
    };
    var safeCol = function(t, col) {
        return (t === null ? '' : me.escaper_.escapeId(t) + '.') + me.escaper_.escapeId(col);
    };
    var t1 = scope.nextTable();
    var t2 = scope.nextTable();
    var t3 = scope.nextTable();

    var childPath = scope.getChildPath(value);
    if (childPath.length === 0) {
        return '(1=2)';
    }
    var last = childPath[childPath.length - 1];

    var eValueCol = this.escaper_.escapeId(last.col);
    var eParentCol = this.escaper_.escapeId(last.parent);
    var eValTable = this.escaper_.escapeId(last.table);

    var me = this;
    var itemSelect = 'SELECT DISTINCT ' + col(t1, eParentCol) + (all ? ',' + col(t1, eValueCol) : '')
        + ' FROM ' + eValTable + ' ' + t1 + ' WHERE ' + col(t1, eValueCol) + ' IN (' + list.map(function(v) {
        return v;
        }).join(',') + ')';

    var parentSelect;
    if (all) {
        var countSelect = 'SELECT ' + col(t2, eParentCol) + ' parent, count(' + col(t2, eValueCol) + ') c  FROM (' + itemSelect + ') ' + t2 + ' GROUP BY ' + col(t2, eParentCol);
        parentSelect = '(SELECT ' + col(t3, 'parent') + ' FROM (' + countSelect + ')  ' + t3 + ' WHERE ' + col(t3, 'c') + ' = ' + me.escaper_.escape(list.length) + ')';
    }
    else {
        parentSelect = '(' + itemSelect + ')';
    }
    // go up the parent hierachy until it is the root object
    for (var i = childPath.length - 2; i >= 0; i--) {
        var cur = childPath[i];
        var tbl = scope.getTableAlias(childPath.slice(0, i));
        parentSelect = safeCol(tbl, cur.id) + ' IN ' + parentSelect;
        if (i > 1) {
            parentSelect = '(SELECT ' + me.escaper_.escapeId(cur.parent) + ' FROM ' + me.escaper_.escapeId(cur.parent) + ' WHERE ' + parentSelect + ')';
        }
    }
    return parentSelect;
};


/**
 * @param {string} value
 * @param {!Array<string>} list
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.notIn = function(value, list) {
    return '(' + value + ' NOT IN (' + list.join(', ') + '))';
};


/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.or = function(x, y) {
    return '(' + x + ' OR ' + y + ')';
};

/**
 * @param {string} x
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.not = function(x) {
    return '(NOT ' + x + ')';
};



/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.lessThanOrEqual = function(x, y) {
    return '(' + x + ' <= ' + y + ')';
};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.lessThan = function(x, y) {
    return '(' + x + ' < ' + y + ')';
};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.greaterThanOrEqual = function(x, y) {
    return '(' + x + ' >= ' + y + ')';
};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.greaterThan = function(x, y) {
    return '(' + x + ' > ' + y + ')';
};


/**
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.true = function() {
    return '1 = 1';
};


/**
 * @param {?} val
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.value = function(val) {
    return this.escaper_.escape(val);
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @param {!Array<string>} path
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.field = function(scope, path) {
    var escaper = this.escaper_;
    var resolved = scope.resolve(path);
    if (resolved.chain) {
        //    4 = (SELECT mentorid FROM `user` u WHERE (u.id = t0.userid))))
        var last = resolved.field[resolved.field.length - 1];
        var lastTable = resolved.field[resolved.field.length - 2];


        var sql = '(SELECT DISTINCT ' + escaper.escapeId(resolved.chain[lastTable]) + '.'
            + escaper.escapeId(last);
        var tables = [];
        var fields = [];
        for (var i = 2; i < resolved.field.length - 2; i += 2) {
            var table = resolved.field[i];
            fields.push(escaper.escapeId(resolved.field[i - 1]) + ' = ' + escaper.escapeId(resolved.field[i + 1]));
            tables.push(escaper.escapeId(table) + ' ' + escaper.escapeId(resolved.chain[table]));
        }
        sql += ' FROM ' + tables.join(',') + ' WHERE ' + fields.join(' AND ') + ')';
        return sql;
    }
    if (resolved.field !== undefined) {
        return resolved.field.map(function(v) { return escaper.escapeId(v);}).join('.');
    }
    else {
        return escaper.escape(resolved.value);
    }

};


/**
 * @param {string} value
 * @param {boolean} exists
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.exists = function(value, exists) {
    if (exists) {
        return '(EXISTS ' + value + ')';
    }
    return '(NOT EXISTS ' + value + ')';

};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.notEquals = function(x, y) {
    return '(' + x + ' <> ' + y + ')';

};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.startsWith = function(x, y) {
    return '(' + x + ' like ' + this.escaper_.escape(y + '%') + ')';
};


/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.containsStr = function(x, y) {
    return '(' + x + ' like ' + this.escaper_.escape('%' + y + '%') + ')';
};

/**
 * @param {string} x
 * @param {string} y
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.equals = function(x, y) {
    return '(' + x + ' = ' + y + ')';

};

/**
 * @param {string} x
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.null = function(x) {
    return '(' + x + ' IS NULL)';
};


/**
 * @interface
 */
recoil.db.QueryExp = function() {};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.QueryExp.prototype.eval = function(scope) {

};

/**
 * note this may throw which indicates it is unknown therefore the top level
 * evaluates to true, however since some expressions it needs to be dealt with differently at the top level
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?}
 */
recoil.db.QueryExp.prototype.matches = function(scope) {

};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.QueryExp.prototype.makeLookup = function(scope) {};


/**
 * generates a query for the scope
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.QueryExp.prototype.query = function(scope) {};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.QueryExp.prototype.serialize = function(serializer) {};

/**
 * @constructor
 * @param {Object} map
 * @param {!recoil.db.QueryHelper=} opt_helper note if you don't provide this query will not work
 * @param {!Object<string,!Array<string>>=} opt_colKeyMap
 */
recoil.db.QueryScope = function(map, opt_helper, opt_colKeyMap) {
    this.map_ = map;
    this.query_ = opt_helper;
    /**
     * @private
     * @type {Object<string,!Array<string>>}
     */
    this.colKeyMap_ = opt_colKeyMap || {};
};
/**
 * @private
 * @param {string} str
 * @return {string}
 */
recoil.db.QueryScope.stripQuotes_ = function(str) {
    if (str.length > 1
        && ((goog.string.startsWith(str, "'") && goog.string.endsWith(str, "'"))
            || (goog.string.startsWith(str, '\"') && goog.string.endsWith(str, '\"')))) {

        return str.substring(1, str.length - 1);
    }
    return str;
};
/**
 * @param {string} exp  expressoin to eval
 * @return {Array<string>}
 */
recoil.db.QueryScope.parts = function(exp) {
    var pos = 0;
    var start = 0;
    var quote = false;
    var parts = [];

    while (pos < exp.length) {
        var ch = exp.charAt(pos);
        if (quote && quote === ch) {
            quote = false;
        }
        else if (quote && ch === '\\') {
            pos = Math.min(pos + 2, exp.length);
            continue;
        }
        else if (ch === '"' || ch === "'") {
            quote = ch;
        }
        else if (!quote) {
            if (ch === '.' || ch === '[' || ch === ']') {
                var str = exp.substring(start, pos);
                if (str.length > 0) {
                    parts.push(recoil.db.QueryScope.stripQuotes_(str));
                }
                start = pos + 1;

            }
        }
        pos++;
    }

    if (start < exp.length) {
        var str = exp.substring(start);
        if (str.length > 0) {
            parts.push(recoil.db.QueryScope.stripQuotes_(str));
        }
    }

    if (parts.length === 0) {
        throw "invalid field '" + exp + "'";
    }

    return parts;
};

/**
 * @return {!recoil.db.QueryHelper}
 */
recoil.db.QueryScope.prototype.query = function() {
    if (!this.query_) {
        throw new Error('Query Helper was not provided');
    }
    return this.query_;
};

/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} parts indexes to get the object
 * @return {{field:(!Array<string>|undefined),value:(?|undefined)}}
 */
recoil.db.QueryScope.prototype.resolve = function(parts) {
    var keyMap = this.colKeyMap_;
    var res = [];
    for (var i = 0; i < parts.length; i++) {
        var el = parts[i];
        if (el instanceof recoil.structs.table.ColumnKey) {
            var path = keyMap[el.getId()];
            if (path === undefined) {
                throw 'unable to find colkey path';
            }
            res = res.concat(path);
        }
        else {
            res.push(el);
        }
    }
    return {field: res};
};

/**
 * @extends {recoil.db.QueryScope}
 * @constructor
 * @param {Object} map
 * @param {!recoil.db.QueryHelper} helper
 * @param {function(?):!Array<{id: string, parent: string, col: string, table:string}>} childPath
 */
recoil.db.DBQueryScope = function(map, helper, childPath) {
    recoil.db.QueryScope.call(this, map, helper);
    this.colMap_ = new recoil.db.PathTableMap();
    this.tableCount_ = 0;
    this.childPath_ = childPath;
};
goog.inherits(recoil.db.DBQueryScope, recoil.db.QueryScope);



/**
 * @param {!recoil.db.expr.Field} field
 * @return {!Array<{id: string, parent: string, col: string, table:string}>}
 */
recoil.db.DBQueryScope.prototype.getChildPath = function(field) {
    return this.childPath_(field.path());
};

/**
 * @param {!Array<string>} path
 * @param {!Array<!recoil.structs.table.ColumnKey>} columns
 * @return {string} the name of the table added
 */
recoil.db.DBQueryScope.prototype.addPathTable = function(path, columns) {
    return this.addPathNamedTable(path, columns, undefined);
};



/**
 * @param {!Array<string>} path the path to the table from the root
 * @param {!Array<!recoil.structs.table.ColumnKey>} columns
 * @param {string|undefined} tname
 * @return {string} the name of the table added
 */
recoil.db.DBQueryScope.prototype.addPathNamedTable = function(path, columns, tname) {
    var table = tname === undefined ? this.nextTable() : tname;
    this.colMap_.setTable(path, columns, table);
    return table;
};

/**
 * @param {!Array<string>} path
 * @return {?string}
 */
recoil.db.DBQueryScope.prototype.getTableAlias = function(path) {
    return this.colMap_.getTableAlias(path);
};


/**
 * gets a unique table name from the scope
 * @return {string}
 */
recoil.db.DBQueryScope.prototype.nextTable = function() {
    var table = 't' + this.tableCount_;
    this.tableCount_++;
    return table;
};
/**
 * @constructor
 */
recoil.db.PathTableMap = function() {
    this.root_ = {table: null, children: new Map()};
    // this is map that directly maps a column to a table for now
    // this only happens if the caller specifies just 1 column key
    this.columns_ = new Map();
};

/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} path
 * @param {!Array<!recoil.structs.table.ColumnKey>} columns
 * @param {string} table
 */
recoil.db.PathTableMap.prototype.setTable = function(path, columns, table) {
    var cur = this.root_;
    for (var i = 0; i < path.length; i++) {
        var name = path[i];

        var child = cur.children.get(name);

        if (!child) {
            child = {table: null, children: new Map()};
            cur.children.set(name, child);
        }
        cur = child;
    }

    cur.table = table;
    var me = this;
    for (i = 0; i < columns.length; i++) {
        var c = columns[i];
        var tables = me.columns_.get(c) || new Map();
        tables.set(table, true);
        me.columns_.set(c, tables);
    }

};


/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} path
 * @return {?string}
 */
recoil.db.PathTableMap.prototype.getTable = function(path) {
    var table = this.getTableAlias(path);


    if (table) {
        return table;
    }

    if (path.length === 1) {
        var tMap = this.columns_.get(path[0]);
        if (tMap && tMap.size == 1) {
            return tMap.keys().next().value;
        }
    }
    return null;
};
/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} path
 * @return {?string}
 */
recoil.db.PathTableMap.prototype.getTableAlias = function(path) {

    var cur = this.root_;
    for (var i = 0; i < path.length && cur; i++) {
        var name = path[i];
        cur = cur.children.get(name);
    }
    if (cur && cur.table) {
        return cur.table;
    }
    return null;
};


/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} parts indexes to get the object
 * @return {{field:(!Array<string>|undefined),value:(?|undefined)}}
 */
recoil.db.DBQueryScope.prototype.resolve = function(parts) {
    if (parts.length === 0) {
        throw 'No parts in path specified';
    }
    if (parts.length == 1 && typeof(parts[0]) === 'string' && this.map_.hasOwnProperty(parts[0])) {

        return {value: this.map_[parts[0]]};
    }

    if (parts.length > 0 && parts[parts.length - 1] instanceof recoil.structs.table.ColumnKey) {

        var table = this.colMap_.getTable(parts);
        if (!table && parts.length === 1) {
            return {field: [parts[0].getName()]};
        }
        return {field: [table, parts[parts.length - 1].getName()]};
    }
    var tbl = this.colMap_.getTableAlias(parts.slice(0, parts.length - 1));

    if (tbl === '' && parts.length === 1) {
        // if we only have one table this is ok
        return {field: [parts[parts.length - 1]]};
    }

    if (!tbl) {
        var childPath = this.childPath_(parts);
        if (childPath.length > 0) {
            var res = {field: [], chain: {}};
            var alias = this.colMap_.getTableAlias([]);
            for (var i = 0; i < childPath.length; i++) {
                var item = childPath[i];
                var next = childPath[i + 1];
                res.chain[item.table] = alias;
                res.field.push(item.table);
                res.field.push(item.col ? item.col : item.id);

                if (next) {
                    alias = this.nextTable();
                    res.field.push(next.table);
                    res.field.push(item.col ? next.id : next.parent);
                }

            }
            return res;
        }

        throw 'Unable to find table for ' + parts.join('/');
    }
    return {field: [tbl, parts[parts.length - 1]]};
};

/**
 * @param {Array<string|!recoil.structs.table.ColumnKey>} parts indexes to get the object
 * @return {*}
 */
recoil.db.QueryScope.prototype.get = function(parts) {

    if (parts.length === 0) {
        return undefined;
    }

    var curScope = this.map_;
    if (parts[0] instanceof recoil.structs.table.ColumnKey) {
        var newParts = this.colKeyMap_[parts[0].getId()];
        if (newParts) {
            parts = newParts;
        }
    }

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        if (curScope instanceof Object) {
            curScope = curScope[part];
        }
        else {
            return undefined;
        }
    }
    return curScope;
};



/**
 * @param {Array<string>} parts indexes to get the object
 * @return {boolean}
 */
recoil.db.QueryScope.prototype.exists = function(parts) {

    if (parts.length === 0) {
        return false;
    }

    var curScope = this.map_;

    for (var i = 0; i < parts.length; i++) {
        if (curScope instanceof Object) {
            if (curScope.hasOwnProperty(parts[i])) {
                curScope = curScope[parts[i]];
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    return true;
};

/**
 * @param {string} exp  expressoin to eval
 * @return {*}
 */
recoil.db.QueryScope.prototype.eval = function(exp) {
    // this might not work for things with keys like strings

    var args = [];
    var vals = [];
    for (var p in this.map_) {
        args.push(p);
        vals.push(this.map_[p]);
    }

    args.push("'use strict'; return " + exp + ';');

    var f = Function.constructor.apply(null, args);
    return f.apply(null, vals);
};


/**
 * @param {string} exp  expressoin to eval
 * @return {function():boolean}
 */
recoil.db.QueryScope.mkWhere = function(exp) {
    // this might not work for things with keys like strings

    var args = ['obj'];
    exp = exp.trim();
    if (goog.string.startsWith(exp, 'function')) {

        args.push("'use strict'; return (" + exp + ')();');
    }
    else {
        args.push("'use strict'; return (" + exp + ');');
    }

    return Function.constructor.apply(null, args);
};


/**
 * @param {function(Object):boolean} func precompiled function
 * @return {boolean}
 */
recoil.db.QueryScope.prototype.evalWhere = function(func) {
    // this might not work for things with keys like strings

    var vals = [this.map_];

    return func.apply(this.map_, vals);
};


/**
 * @typedef {{all:(boolean|undefined), result:(boolean|undefined)}}
 */
recoil.db.QueryOptionsColFilter;

/**
 * @constructor
 * @param {{count:(boolean|undefined), sortOrder:(Array|undefined),
  * rate:(number|undefined),size:(undefined|number),columnFilters:(undefined|Array<recoil.db.QueryOptionsColFilter>)}=} opt_options
 */
recoil.db.QueryOptions = function(opt_options) {
    this.options_ = opt_options || {};
    var me = this;
    this.columnFilter_ = function(path, subtable) {
        var colFilters = me.options_.columnFilters || [];
        for (var i = 0; i < colFilters.length; i++) {
            var filter = colFilters[i];
            if (filter.all) {
                return filter.result;
            }
            if (filter.prefix) {
                var match = true;
                for (var j = 0; match && j < Math.min(path.length, filter.prefix.length); j++) {
                    match = filter.prefix[j] === path[j];
                }
                if (match) {
                    return filter.result;
                }
            }
            if (subtable && filter.hasOwnProperty('subtable')) {
                return filter['subtable'];
            }
        }
        return true;
    };
};

/**
 * @return {boolean}
 */
recoil.db.QueryOptions.prototype.isCount = function() {
    return !!this.options_.count;
};


/**
 * @return {?number|undefined}
 */
recoil.db.QueryOptions.prototype.size = function() {
    return this.options_.size;
};

/**
 * @return {?{next:?, page:number}}
 */
recoil.db.QueryOptions.prototype.start = function() {
    return this.options_.start;
};


/**
 * @return {function(!Array<string>,boolean):boolean}
 */
recoil.db.QueryOptions.prototype.columnFilter = function() {
    return this.columnFilter_;
};

/**
 * @return {?Array<!recoil.db.Query>}
 */
recoil.db.QueryOptions.prototype.sortOrder = function() {
    return this.options_.sortOrder || [];
};


/**
 * @return {?}
 */
recoil.db.QueryOptions.prototype.serialize = function() {
    return this.options_;
};



/**
 * @return {!recoil.db.QueryOptions}
 */
recoil.db.QueryOptions.prototype.cleanStart = function() {
    var options = Object.assign({}, this.options_);

    if (options.start) {
        if (options.start.page !== undefined) {
            options.start = {page: options.start.page};
        }
    }
    return new recoil.db.QueryOptions(options);
};

/**
 * @param {Object} obj
 * @return {!recoil.db.QueryOptions}
 */
recoil.db.QueryOptions.deserialize = function(obj) {
    if (obj) {
        var clone = Object.assign({}, obj);
        return new recoil.db.QueryOptions(clone);
    }
    return new recoil.db.QueryOptions();
};

/**
 * makes a query, this is utility class for building up expression
 * that can be sent to the database to filter requests
 *
 * @constructor
 * @param {recoil.db.QueryExp=} opt_expr
 */
recoil.db.Query = function(opt_expr) {
    /**
     * @type {recoil.db.QueryExp}
     * @private
     */
    this.expr_ = opt_expr || null;
};

/**
 * @interface
 */
recoil.db.Query.Serializer = function() {};

/**
 * @param {?} val
 * @return {!recoil.structs.table.ColumnKey}
 */
recoil.db.Query.Serializer.prototype.deserializeCol = function(val) {};

/**
 * @param {!recoil.structs.table.ColumnKey} col
 * @return {?}
 */
recoil.db.Query.Serializer.prototype.serializeCol = function(col) {};


/**
 * @param {?} val
 * @return {?}
 */
recoil.db.Query.Serializer.prototype.deserializeValue = function(val) {};

/**
 * @param {?} val
 * @return {?}
 */
recoil.db.Query.Serializer.prototype.serializeValue = function(val) {};


/**
 *
 * @param {?} cls
 * @return {function(?, !recoil.db.Query.Serializer):recoil.db.QueryExp} ;
 */

recoil.db.Query.binaryDeserializer = function(cls) {
    return function(data, serializer) {
        return new cls(recoil.db.Query.deserializeExp(data.x, serializer), recoil.db.Query.deserializeExp(data.y, serializer));
    };
};

/**
 *
 * @param {?} cls
 * @return {function(?, !recoil.db.Query.Serializer):recoil.db.QueryExp} ;
 */

recoil.db.Query.unaryDeserializer = function(cls) {
    return function(data, serializer) {
        return new cls(recoil.db.Query.deserializeExp(data.x, serializer));
    };
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.Query}
 */
recoil.db.Query.deserialize = function(data, serializer) {
    var factory = recoil.db.Query.deserializeMap[data.op];

    if (!factory) {
        throw new Error('Unknown Expression Type ' + data.op);
    }

    return new recoil.db.Query(factory(data, serializer));
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.QueryExp}
 */
recoil.db.Query.deserializeExp = function(data, serializer) {
    var factory = recoil.db.Query.deserializeMap[data.op];

    if (!factory) {
        throw new Error('Unknown Expression Type ' + data.op);
    }

    return factory(data, serializer);
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.query = function(scope) {
    return this.expr_.query(scope);
};


/**
 * this needs a special scope that doesn't resolve fields that are in the database
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.makeLookup = function(scope) {
    return this.expr_.makeLookup(scope);
};

/**
 * @return {string}
 */
recoil.db.Query.prototype.toString = function() {
    return this.expr_.toString();
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.eval = function(scope) {
    return this.expr_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {boolean} returns true if there is a possiblity that expression may return true
 */
recoil.db.Query.prototype.mayMatch = function(scope) {
    var res = this.expr_.matches(scope);
    if (res === undefined) {
        return true;
    }
    return !!res;
};

/**
 * returns a basic object that can stringified and sent over the wire
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.Query.prototype.serialize = function(serializer) {
    return this.expr_.serialize(serializer);
};


/**
 * applies variable number operators together to the function
 * @private
 * @template T
 * @param {function(new:T,...(!recoil.db.Query|!recoil.db.QueryExp)):recoil.db.Query|
          function (new:T,!recoil.db.QueryExp,!recoil.db.QueryExp)} constructor
 * @param {IArrayLike<recoil.db.Query|recoil.db.QueryExp>} args
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.chain_ = function(constructor, args) {
    if (this.expr_ === null && args.length === 0) {
        throw new Error('Not enough parameters');
    }
    var start = args.length - 2;
    var cur = args.length > 0 ? this.toExpr(args[args.length - 1]) : this.expr_;

    for (var i = start; i >= 0; i--) {
        cur = new constructor(this.toExpr(args[i]), cur);
    }

    if (this.expr_ !== null && args.length > 0) {
        cur = new constructor(this.expr_, cur);
    }
    return new recoil.db.Query(cur);

};
/**
 * utilty to function to set this expression to the query
 * @private
 * @param {!recoil.db.Query} query
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.set_ = function(query) {
    this.expr_ = query.expr_;
    return this;
};

/**
 * utilty to function to set this expression to the query
 * @private
 * @param {recoil.db.QueryExp} query
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.query_ = function(query) {

    return new recoil.db.Query(query);
};


/**
 * @param {...(!recoil.db.Query|!recoil.db.QueryExp|!recoil.structs.table.ColumnKey)} var_others
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.and$ = function(var_others) {
    return this.set_(this.chain_(recoil.db.expr.And, arguments));
};

/**
 * ands together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(!recoil.db.Query|!recoil.db.QueryExp|!recoil.structs.table.ColumnKey)} var_others
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.and = function(var_others) {
    return this.chain_(recoil.db.expr.And, arguments);
};



/**
 * ands together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {!Array<(!recoil.db.Query|!recoil.db.QueryExp|!recoil.structs.table.ColumnKey)>} args
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.concat = function(args) {
    var me = this;
    return this.query_(new recoil.db.expr.Concat(args.map(function(v) {return me.toExpr(v);})));
};

/**
 * ors together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey)} var_others
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.or = function(var_others) {
    return this.chain_(recoil.db.expr.Or, arguments);
};

/**
 * ors together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(!recoil.db.Query|!recoil.db.QueryExp)} var_others
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.or$ = function(var_others) {
    return this.set_(this.chain_(recoil.db.expr.Or, arguments));
};

/**
 *
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey=} opt_x
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.not = function(opt_x) {
    var x = opt_x;
    if (opt_x === undefined) {
        x = this.expr_;
    }
    return this.query_(new recoil.db.expr.Not(this.toExpr(x)));
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp=} opt_x
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.not$ = function(opt_x) {
    return this.set_(this.not(opt_x));
};

/**
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.True = function() {
    return this.query_(new recoil.db.expr.True());
};

/**
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.False = function() {
    return this.query_(new recoil.db.expr.Not(new recoil.db.expr.True()));
};


/**
 * @param {recoil.db.Query|recoil.db.QueryExp=} opt_x
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.True$ = function(opt_x) {
    return this.set_(this.True());
};


/**
 * @param {?} val
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.val = function(val) {
    return this.query_(new recoil.db.expr.Value(val));
};

/**
 * @param {string|!recoil.structs.table.ColumnKey|!Array<string>} field
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.field = function(field) {
    return this.query_(new recoil.db.expr.Field(field));
};


/**
 * @param {string} expr
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.raw = function(expr) {
    return this.query_(new recoil.db.expr.Raw(expr));
};


/**
 * @param {string|!recoil.structs.table.ColumnKey} field
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.field$ = function(field) {
    return this.set_(this.field(field));
};
/**
 * checks if a field exists in the object
 * nulls and undefined exist
 * @param {string|!Array<string>|!recoil.db.Query|!recoil.structs.table.ColumnKey} field
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.exists = function(field) {
    return this.query_(new recoil.db.expr.Exists(this.fromField_(field), true));
};
/**
 * checks if a field exists in the object, also sets the result to this query
 * nulls and undefined exist
 * @param {string} field
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.exists$ = function(field) {
    return this.set_(this.exists(field));
};


/**
 * this is not called equals because that should compare to queries
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} left
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.eq = function(left, right) {
    return this.query_(new recoil.db.expr.Equals(this.toExpr(left), this.toExpr(right)));
};


/**
 * this is not called equals because that should compare to queries
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} op
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.null = function(op) {
    return this.query_(new recoil.db.expr.Null(this.toExpr(op)));
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} left
 * @param {string} match
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.startsWith = function(left, match) {
    return this.query_(new recoil.db.expr.StartsWith(this.toExpr(left), match));
};


/**
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} left
 * @param {string} match
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.containsStr = function(left, match) {
    return this.query_(new recoil.db.expr.ContainsStr(this.toExpr(left), match));
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} field
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.containsAll = function(field, values) {
    return this.query_(new recoil.db.expr.Contains(this.toField(field), this.fromArray_(values), true));
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} field
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.containsAny = function(field, values) {
    return this.query_(new recoil.db.expr.Contains(this.toField(field), this.fromArray_(values), false));
};

/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.eq$ = function(left, right) {
    return this.set_(this.eq(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.neq = function(left, right) {
    return this.query_(new recoil.db.expr.NotEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * nulls and undefined exist
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.neq$ = function(left, right) {
    return this.set_(this.neq(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.lt = function(left, right) {
    return this.query_(new recoil.db.expr.LessThan(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.lt$ = function(left, right) {
    return this.set_(this.lt(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.lte = function(left, right) {
    return this.query_(new recoil.db.expr.LessThanOrEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.lte$ = function(left, right) {
    return this.set_(this.lte(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.gt = function(left, right) {
    return this.query_(new recoil.db.expr.GreaterThan(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.gt$ = function(left, right) {
    return this.set_(this.gt(left, right));
};


/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.gte = function(left, right) {
    return this.query_(new recoil.db.expr.GreaterThanOrEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.gte$ = function(left, right) {
    return this.set_(this.gte(left, right));
};

/**
 * checks if a field does not exists in the object
 * nulls and undefined exist
 * @param {string|!Array|!recoil.db.Query} field string is assumed to be a field
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.notExists = function(field) {
    return this.query_(new recoil.db.expr.Exists(this.fromField_(field), false));
};
/**
 * checks if a field does not exist in the object, also sets the result to this query
 * nulls and undefined exist
 *
 * @param {string} field
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.notExists$ = function(field) {
    return this.set_(this.notExists(field));
};

/**
 * runs a boolean javascript expression on each object
 * the current object can be referenced via this, or obj
 * @param {string} expr
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.where = function(expr) {
    return this.query_(new recoil.db.expr.Where(expr));
};
/**
 * runs a boolean javascript expression on each object
 * the current object can be referenced via this, or obj
 * @param {string} expr
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.where$ = function(expr) {
    return this.set_(this.where(expr));
};



/**
 * @param {string|!Array<string>|!recoil.db.Query} field
 * @param {string|RegExp} pattern
 * @param {?string=} opt_options
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.regex = function(field, pattern, opt_options) {
    return this.query_(new recoil.db.expr.RegExp(this.fromFieldOrValue_(field), pattern, opt_options));
};
/**
 * @param {string} field
 * @param {string|RegExp} pattern
 * @param {?string=} opt_options
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.regex$ = function(field, pattern, opt_options) {
    return this.set_(this.regex(field, pattern, opt_options));
};


/**
 * @private
 * @param {string|!Array<string>|!recoil.db.Query|!recoil.structs.table.ColumnKey} field
 * @return {!recoil.db.expr.Field}
 */
recoil.db.Query.prototype.fromField_ = function(field) {
    if (typeof (field) === 'string' || field instanceof Array || field instanceof recoil.structs.table.ColumnKey) {
        return new recoil.db.expr.Field(field);
    }
    if (field.expr_ === null) {
        throw 'unexpected null in expression';
    }
    if (!(field.expr_ instanceof recoil.db.expr.Field)) {
        throw 'field expected';
    }
    return /** @type {!recoil.db.expr.Field} */ (field.expr_);
};

/**
 * @private
 * @param {string|!Array<string>|!recoil.db.Query|!recoil.structs.table.ColumnKey} field
 * @return {!recoil.db.QueryExp}
 */
recoil.db.Query.prototype.fromFieldOrValue_ = function(field) {
    if (typeof (field) === 'string' || field instanceof Array || field instanceof recoil.structs.table.ColumnKey) {
        return new recoil.db.expr.Field(field);
    }
    if (field.expr_ === null) {
        throw 'unexpected null in expression';
    }
    return field.expr_;
};

/**
 * @private
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!Array<!recoil.db.QueryExp>}
 */
recoil.db.Query.prototype.fromArray_ = function(values) {
    return values.map(function(value) {
        if (value instanceof recoil.db.Query) {
            if (value.expr_ === null) {
                throw 'unexpected null in expression';
            }
            return value.expr_;
        }
        return new recoil.db.expr.Value(value);
    });
};


/**
 * @param {string|!Array|!recoil.db.Query|!recoil.structs.table.ColumnKey} value string is assumed to be a value
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.isIn = function(value, values) {
    return this.query_(new recoil.db.expr.In(this.fromFieldOrValue_(value), this.fromArray_(values)));
};
/**
 * function with $ after replace self
 * @param {string|!Array|!recoil.db.Query} field string is assumed to be a field
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.isIn$ = function(field, values) {
    return this.set_(this.isIn(field, values));
};

/**
 * @param {string|!Array|!recoil.db.Query} field string is assumed to be a field
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */
recoil.db.Query.prototype.notIn = function(field, values) {
    return this.query_(new recoil.db.expr.NotIn(this.fromFieldOrValue_(field), this.fromArray_(values)));
};
/**
 * @param {string|!Array|!recoil.db.Query} field string is assumed to be a field
 * @param {!Array<*>|Array<!recoil.db.Query>} values non query values are assumed to be values
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.notIn$ = function(field, values) {
    return this.set_(this.notIn(field, values));
};

/**
 * convert a query or an expression to an expression
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} exp
 * @return {!recoil.db.QueryExp}
 */
recoil.db.Query.prototype.toExpr = function(exp) {
    if (exp instanceof recoil.db.Query) {
        if (exp.expr_ === null) {
            throw 'unexpected null in expression';
        }
        return exp.expr_;
    }
    if (exp instanceof recoil.structs.table.ColumnKey) {
        return new recoil.db.expr.Field(exp);
    }
    if (exp instanceof String) {
        return new recoil.db.expr.Field(exp.toString());
    }
    if (typeof(exp) === 'string') {
        return new recoil.db.expr.Field(exp.toString());
    }

    if (exp instanceof recoil.db.QueryExp) {
        return exp;
    }
    if (exp instanceof Object) {
        return /** @type {!recoil.db.QueryExp} */ (exp);
    }

    return new recoil.db.expr.Value(exp);
};


/**
 * @param {recoil.db.Query|recoil.db.QueryExp|!recoil.structs.table.ColumnKey|*} exp
 * @return {!recoil.db.expr.Field}
 */
recoil.db.Query.prototype.toField = function(exp) {
    if (exp instanceof recoil.db.Query) {
        if (exp.expr_ === null) {
            throw 'unexpected null in expression';
        }
        exp = exp.expr_;
    }
    if (exp instanceof recoil.db.expr.Field) {
        return exp;
    }
    if (exp instanceof recoil.structs.table.ColumnKey) {
        return new recoil.db.expr.Field(exp);
    }
    if (exp instanceof String) {
        return new recoil.db.expr.Field(exp.toString());
    }
    if (typeof(exp) === 'string') {
        return new recoil.db.expr.Field(exp.toString());
    }
    throw new Error('unexpected type');
};


/**
 * @const
 */
recoil.db.expr.FIELD = {};
/**
 * used by makeLookup to check if the result is a field
 * @private
 * @param {?Array<Object<string,?>>} v
 * @return {boolean}
 */
recoil.db.expr.isField_ = function(v) {
    if (!v || v.length !== 1) {
        return false;
    }
    var c = 0;
    for (var k in v[0]) {
        if (c > 0) {
            return false;
        }
        if (v[0][k] !== recoil.db.expr.FIELD) {
            return false;
        }
    }
    return true;
};

/**
 * used by makeLookup to check if the result is a field
 * @private
 * @param {?Array<Object<string,?>>} v
 * @return {boolean}
 */
recoil.db.expr.isValue_ = function(v) {
    if (!v || v.length !== 1) {
        return false;
    }
    for (var k in v[0]) {
        if (k !== '') {
            return false;
        }
    }
    return true;
};


/**
 * @constructor
 * @implements {recoil.db.QueryExp}
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 */
recoil.db.expr.And = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.And.prototype.eval = function(scope) {
    return this.x_.eval(scope) && this.y_.eval(scope);
};



/**
 * @return {string}
 */
recoil.db.expr.And.prototype.toString = function() {
    return '(' + this.x_.toString() + ' and ' + this.y_.toString() + ')';
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.And.prototype.makeLookup = function(scope) {
    var x = this.x_.makeLookup(scope);
    var y = this.y_.makeLookup(scope);

    if (x === null || y === null) {
        return null;
    }
    if (x.length === 0) {
        return y;
    }
    if (y.length === 0) {
        return x;
    }
    var res = [];
    for (var i = 0; i < x.length; i++) {
        var out = goog.object.clone(x[i]);
        for (var j = 0; j < y.length; j++) {
            for (var yPath in y[i]) {
                var yVal = y[i][yPath];
                var xVal = x[i][yPath];
                if (xVal === undefined) {
                    out[yPath] = yVal;
                }
                else if (xVal != yVal) {
                    return null;
                }
            }
        }
        if (out !== null) {
            res.push(out);
        }
    }

    return res;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {?}
 */
recoil.db.expr.And.prototype.matches = function(scope) {

    var resx = this.x_.matches(scope);
    if (resx === undefined || resx === false) {
        return resx;
    }

    return this.y_.matches(scope);
};
/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.And.prototype.query = function(scope) {
    return scope.query().and(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.And.prototype.serialize = function(serializer) {
    return {op: '&', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};



/**
 * @constructor
 * @implements {recoil.db.QueryExp}
 * @param {!Array<!recoil.db.QueryExp>} args
 */
recoil.db.expr.Concat = function(args) {
    this.args_ = args;
};


/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Concat.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.Concat}
 */
recoil.db.expr.Concat.deserialize = function(data, serializer) {
    return new recoil.db.expr.Concat(data.args.map(function(v) { return recoil.db.Query.deserializeExp(v, serializer);}));
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Concat.prototype.eval = function(scope) {
    return this.args_.map(function(v)  { return v.eval(scope);}).join('');
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Concat.prototype.query = function(scope) {

    return scope.query().concat(this.args_.map(function(v) { return v.query(scope);}));
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @suppress {checkTypes}
 * @return {?}
 */
recoil.db.expr.Concat.prototype.matches = function(scope) {
    return this.eval(scope);
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Concat.prototype.serialize = function(serializer) {
    return {op: 'concat', args: this.args_.map(function(v) {return v.serialize(serializer);})};
};

/**
 * @return {string}
 */
recoil.db.expr.Concat.prototype.toString = function() {
    return 'concat(' + this.args_.map(function(c) {return c.toString();}).join(',') + ')';
};

/**
 * @constructor
 * @implements {recoil.db.QueryExp}
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 */
recoil.db.expr.Or = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Or.prototype.eval = function(scope) {
    return this.x_.eval(scope) || this.y_.eval(scope);
};

/**
 * @return {string}
 */
recoil.db.expr.Or.prototype.toString = function() {
    return '(' + this.x_.toString() + ' and ' + this.y_.toString() + ')';
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Or.prototype.makeLookup = function(scope) {
    var x = this.x_.makeLookup(scope);
    var y = this.y_.makeLookup(scope);

    if (x === null && y === null) {
        return null;
    }
    if (x === null) {
        return y;
    }
    if (y === null) {
        return x;
    }
    return x.concat(y);
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Or.prototype.matches = function(scope) {
    var resx = this.x_.matches(scope);
    if (resx && resx !== undefined) {
        return true;
    }
    var resy = this.y_.matches(scope);
    if (resy !== undefined) {
        return !!resy;
    }

    return undefined;
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Or.prototype.query = function(scope) {
    return scope.query().or(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Or.prototype.serialize = function(serializer) {
    return {op: '|', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};


/**
 * @constructor
 * @implements {recoil.db.QueryExp}
 * @param {!recoil.db.QueryExp} x
 */
recoil.db.expr.Not = function(x) {
    this.x_ = x;
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Not.prototype.makeLookup = function(scope) {

    var x = this.x_.makeLookup(scope);

    if (x === null) {
        return [];
    }
    if (x.length === 0) {
        return null;
    }
    return [];
};

/**
 * @return {string}
 */
recoil.db.expr.Not.prototype.toString = function() {
    return '(not ' + this.x_.toString() + ')';
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Not.prototype.eval = function(scope) {
    return !this.x_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {?}
 */
recoil.db.expr.Not.prototype.matches = function(scope) {
    var res = this.x_.matches(scope);
    return res === undefined ? res : !res;
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Not.prototype.query = function(scope) {
    return scope.query().not(this.x_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Not.prototype.serialize = function(serializer) {
    return {op: '!', x: this.x_.serialize(serializer)};
};

/**
 * @constructor
 * @param {!recoil.db.expr.Field} field
 * @param {boolean} exists
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Exists = function(field, exists) {
    this.val_ = field;
    this.exists_ = exists;
};



/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Exists.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Exists.prototype.eval = function(scope) {
    if (this.val_.path instanceof Function) {
        return scope.exists(this.val_.path()) === this.exists_;
    }
    throw 'exists must have field to be evaluated';
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Exists.prototype.query = function(scope) {
    return scope.query().exists(this.val_.query(scope), this.exists_);
};

/**
 * @return {string}
 */
recoil.db.expr.Exists.prototype.toString = function() {
    return '(' + (this.exists_ ? '' : 'NOT') + 'EXISTS ' + this.val_.toString() + ')';
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @suppress {checkTypes}
 * @return {*}
 */
recoil.db.expr.Exists.prototype.matches = function(scope) {
    try {
        return this.eval(scope);
    }
    catch (e) {
        return undefined;
    }
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Exists.prototype.serialize = function(serializer) {
    return {op: '?', x: this.val_.serialize(serializer), exists: this.exists_};
};


/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Equals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Equals.prototype.eval = function(scope) {
    return recoil.db.expr.Equals.isEqual(this.x_.eval(scope), this.y_.eval(scope));
};


/**
 * @return {string}
 */
recoil.db.expr.Equals.prototype.toString = function() {
    return this.x_.toString() + ' = ' + this.y_.toString();
};
/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Equals.prototype.makeLookup = function(scope) {
    let resx = this.x_.makeLookup(scope);
    let resy = this.y_.makeLookup(scope);

    if (resx === null || resy === null) {
        return null;
    }
    if (resx.length === 0 || resy.length === 0) {
        return [];
    }

    if (recoil.db.expr.isField_(resx) && recoil.db.expr.isField_(resy)) {
        return [];
    }

    if (recoil.db.expr.isValue_(resx) && recoil.db.expr.isValue_(resy)) {
        return [];
    }

    function makeMap(path, value) {
        let res = {};
        res[path] = value;
        return res;
    }

    if (recoil.db.expr.isField_(resx) && recoil.db.expr.isValue_(resy)) {
        return [makeMap(Object.keys(/** @type {!Object} */ (resx[0]))[0], resy[0][''])];
    }
    if (recoil.db.expr.isField_(resy) && recoil.db.expr.isValue_(resx)) {
        return [makeMap(Object.keys(/** @type {!Object} */ (resy[0]))[0], resx[0][''])];
    }
    return [];
};
/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Equals.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return undefined;
    }

    return recoil.db.expr.Equals.isEqual(resx, resy);
};

/**
 * @param {?} x
 * @param {?} y
 * @return {boolean}
 */
recoil.db.expr.Equals.isEqual = function(x, y) {
    if (x === y) {
        return true;
    }
    var typex = typeof(x);
    var typey = typeof(y);

    if (typex !== typey && ((typex === 'bigint' && typey === 'number') || (typey === 'bigint' && typex === 'number'))) {
        return x == y;
    }
    return false;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Equals.prototype.query = function(scope) {
    return scope.query().equals(this.x_.query(scope), this.y_.query(scope));
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Equals.prototype.serialize = function(serializer) {
    return {op: '=', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};


/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Null = function(x) {
    this.x_ = x;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Null.prototype.eval = function(scope) {
    return this.x_.eval(scope) == null;
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Null.prototype.matches = function(scope) {
    var res = this.x_.eval(scope);

    if (res === undefined) {
        return undefined;
    }
    return res == null;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Null.prototype.query = function(scope) {
    return scope.query().null(this.x_.query(scope));
};

/**
 * @return {string}
 */
recoil.db.expr.Null.prototype.toString = function() {
    return this.x_.toString() + ' IS NULL';
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Null.prototype.makeLookup = function(scope) {
    var res = this.x_.makeLookup(scope);
    // set all values to null
    return res === null ? null : res.map(function(x) {
        for (var k in x) {
            x[k] = null;
        }
        return x;

    });
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Null.prototype.serialize = function(serializer) {
    return {op: 'null', x: this.x_.serialize(serializer)};
};


/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {string} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.StartsWith = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.StartsWith.prototype.eval = function(scope) {
    return (this.x_.eval(scope) + '').toLowerCase().indexOf((this.y_ + '').toLowerCase()) === 0;
};

/**
 * @return {string}
 */
recoil.db.expr.StartsWith.prototype.toString = function() {
    return '(' + this.x_.toString() + ' StartsWith ' + JSON.stringify(this.y_) + ')';
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.StartsWith.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    if (resx === undefined) {
        return undefined;
    }

    return (resx + '').toLowerCase().indexOf((this.y_ + '').toLowerCase()) === 0;
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.StartsWith.prototype.query = function(scope) {
    return scope.query().startsWith(this.x_.query(scope), this.y_);
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.StartsWith.prototype.serialize = function(serializer) {
    return {op: 'startsWith', x: this.x_.serialize(serializer), y: this.y_};
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.StartsWith}
 */
recoil.db.expr.StartsWith.deserialize = function(data, serializer) {
    return new recoil.db.expr.StartsWith(recoil.db.Query.deserializeExp(data.x, serializer), data.y + '');
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.StartsWith.prototype.makeLookup = function(scope) {
    return [];
};


/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {string} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.ContainsStr = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.ContainsStr.prototype.eval = function(scope) {
    return (this.x_.eval(scope) + '').toLowerCase().indexOf((this.y_ + '').toLowerCase()) !== -1;
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.ContainsStr.prototype.matches = function(scope) {
    var val = this.x_.eval(scope);
    if (val === undefined) {
        return undefined;
    }
    return (val + '').toLowerCase().indexOf((this.y_ + '').toLowerCase()) !== -1;
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.ContainsStr.prototype.query = function(scope) {
    return scope.query().containsStr(this.x_.query(scope), this.y_);
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.ContainsStr.prototype.serialize = function(serializer) {
    return {op: 'containsStr', x: this.x_.serialize(serializer), y: this.y_};
};
/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.ContainsStr}
 */
recoil.db.expr.ContainsStr.deserialize = function(data, serializer) {
    return new recoil.db.expr.ContainsStr(recoil.db.Query.deserializeExp(data.x, serializer), data.y + '');
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.ContainsStr.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.NotEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};


/**
 * @return {string}
 */
recoil.db.expr.NotEquals.prototype.toString = function() {
    return this.x_.toString() + ' != ' + this.y_.toString();
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotEquals.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return undefined;
    }
    return !recoil.db.expr.Equals.isEqual(resx, resy);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotEquals.prototype.eval = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    return !recoil.db.expr.Equals.isEqual(resx, resy);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.NotEquals.prototype.query = function(scope) {
    return scope.query().notEquals(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.NotEquals.prototype.serialize = function(serializer) {
    return {op: '!=', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.NotEquals.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.GreaterThan = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.GreaterThan.prototype.serialize = function(serializer) {
    return {op: '>', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThan.prototype.eval = function(scope) {
    return this.x_.eval(scope) > this.y_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.GreaterThan.prototype.query = function(scope) {
    return scope.query().greaterThan(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThan.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return resy === undefined;
    }
    return resx > resy;
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.GreaterThan.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.GreaterThanOrEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) >= this.y_.eval(scope);
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.serialize = function(serializer) {
    return {op: '>=', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.query = function(scope) {
    return scope.query().greaterThanOrEqual(this.x_.query(scope), this.y_.query(scope));
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return resy === undefined;
    }
    return resx >= resy;
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.LessThan = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.LessThan.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThan.prototype.eval = function(scope) {
    return this.x_.eval(scope) < this.y_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.LessThan.prototype.query = function(scope) {
    return scope.query().lessThan(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.LessThan.prototype.serialize = function(serializer) {
    return {op: '<', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThan.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return resy === undefined;
    }
    return resx < resy;
};

/**

 * @constructor
 * @param {!recoil.db.QueryExp} x
 * @param {!recoil.db.QueryExp} y
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.LessThanOrEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.LessThanOrEquals.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThanOrEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) <= this.y_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThanOrEquals.prototype.matches = function(scope) {
    var resx = this.x_.eval(scope);
    var resy = this.y_.eval(scope);
    if (resx === undefined || resy === undefined) {
        return resy === undefined;
    }
    return resx <= resy;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.LessThanOrEquals.prototype.query = function(scope) {
    return scope.query().lessThanOrEqual(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.LessThanOrEquals.prototype.serialize = function(serializer) {
    return {op: '<=', x: this.x_.serialize(serializer), y: this.y_.serialize(serializer)};
};
/**
 * @constructor
 * @param {!recoil.db.QueryExp} field
 * @param {!Array<!recoil.db.QueryExp>} list
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.In = function(field, list) {
    this.field_ = field;
    this.list_ = list;
};


/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.In.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.In}
 */
recoil.db.expr.In.deserialize = function(data, serializer) {
    return new recoil.db.expr.In(recoil.db.Query.deserializeExp(data.field, serializer), data.list.map(
        function(v) {
            return recoil.db.Query.deserializeExp(v, serializer);
        }));
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.In.prototype.serialize = function(serializer) {
    return {op: 'in', field: this.field_.serialize(serializer), list: this.list_.map(function(v) {return v.serialize(serializer);})};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.In.prototype.eval = function(scope) {
    var v = this.field_.eval(scope);
    return recoil.db.expr.In.contains(scope, v, this.list_);

};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.In.prototype.matches = function(scope) {
    var v = this.field_.eval(scope);
    if (v === undefined) {
        return undefined;
    }
    return recoil.db.expr.In.contains(scope, v, this.list_, true);

};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.In.prototype.query = function(scope) {
    return scope.query().in (this.field_.query(scope), this.list_.map(function(v) { return v.query(scope); }));
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @param {?} val
 * @param {!Array<!recoil.db.QueryExp>} expList
 * @param {boolean=} opt_matches
 * @return {boolean|undefined}
 */
recoil.db.expr.In.contains = function(scope, val, expList, opt_matches) {
    for (var i = 0; i < expList.length; i++) {
        var exp = expList[i].eval(scope);
        if (opt_matches && exp === undefined) {
            return undefined;
        }
        if (recoil.db.expr.Equals.isEqual(val, exp)) {
            return true;
        }
    }
    return false;
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} field
 * @param {Array<!recoil.db.QueryExp>} list
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.NotIn = function(field, list) {
    this.field_ = field;
    this.list_ = list;
};
/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotIn.prototype.eval = function(scope) {
    var v = this.field_.eval(scope);
    return !recoil.db.expr.In.contains(scope, v, this.list_ || []);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotIn.prototype.matches = function(scope) {
    var v = this.field_.eval(scope);
    if (v === undefined) {
        return undefined;
    }
    var res = recoil.db.expr.In.contains(scope, v, this.list_ || [], true);
    return res === undefined ? undefined : !res;
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.NotIn.prototype.query = function(scope) {
    return scope.query().notIn(this.field_.query(scope), this.list_.map(function(v) { return v.query(scope); }));
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.NotIn}
 */
recoil.db.expr.NotIn.deserialize = function(data, serializer) {
    return new recoil.db.expr.NotIn(recoil.db.Query.deserializeExp(data.field, serializer), data.list.map(
        function(v) {
            return recoil.db.Query.deserializeExp(v, serializer);
        }));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.NotIn.prototype.serialize = function(serializer) {
    return {op: '!in', field: this.field_.serialize(serializer), list: this.list_.map(function(v) {return v.serialize(serializer);})};
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.NotIn.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * accessor for items in the database
 * @constructor
 * @param {string|!Array<string>|!recoil.structs.table.ColumnKey} name this can be a dot seperated and use [] to acces arrays or maps
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Field = function(name) {
    this.parts_ = typeof(name) === 'string' || name instanceof recoil.structs.table.ColumnKey ? [name] : name;
    if (this.parts_.length === 0) {
        throw "invalid field '" + name + "'";
    }
};



/**
 * @return {string}
 */
recoil.db.expr.Field.prototype.toString = function() {
    return '`' + this.parts_.join('.') + '`';
};

/**
 * @return {!Array<string|!recoil.structs.table.ColumnKey>}
 */
recoil.db.expr.Field.prototype.path = function() {
    return this.parts_;
};
/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Field.prototype.eval = function(scope) {
    return scope.get(this.parts_);
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Field.prototype.matches = function(scope) {
    try {
        return scope.get(this.parts_);
    }
    catch (e) {
        return undefined;
    }
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.Field}
 */
recoil.db.expr.Field.deserialize = function(data, serializer) {
    return new recoil.db.expr.Field(data.parts.map(
        function(v, idx) {
            if (idx === 0 && v.path) {
                return serializer.deserializeCol(v.path);
            }
            return v;
        }));
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Field.prototype.serialize = function(serializer) {
    return {op: 'field', parts: this.parts_.map(

        function(v) {
            if (typeof(v) === 'string') {
                return v;
            }

            return {path: serializer.serializeCol(v)};

        })};
};

/**
  * @param {recoil.db.QueryScope} scope
  * @return {string}
  */
recoil.db.expr.Field.prototype.query = function(scope) {
    return scope.query().field(scope, this.parts_);
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Field.prototype.makeLookup = function(scope) {
    var res = (/** @type {recoil.db.expr.Field} */ (this)).eval(scope);
    return [res];
};

/**
 * accessor for items in the database
 * @constructor
 * @param {string} expr
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Raw = function(expr) {
    this.expr_ = expr;
};
/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Raw.prototype.eval = function(scope) {
    return true; // can't eval this
};

/**
 * @return {string}
 */
recoil.db.expr.Raw.prototype.toString = function() {
    return 'RAW[' + this.expr_ + ']';
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Raw.prototype.matches = function(scope) {
    return undefined;
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.Not}
 */
recoil.db.expr.Raw.deserialize = function(data, serializer) {
    // we can't deserialize this it is a security risk sending arbitary queries to the
    // database bad
    return new recoil.db.expr.Not(new recoil.db.expr.True());
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Raw.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Raw.prototype.serialize = function(serializer) {
    return {op: 'raw'};
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Raw.prototype.query = function(scope) {
    return this.expr_;
};

/**
 * @constructor
 * @param {?} val
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Value = function(val) {
    this.val_ = val;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Value.prototype.eval = function(scope) {
    return this.val_;
};

/**
 * @return {string}
 */
recoil.db.expr.Value.prototype.toString = function() {
    return this.val_ == null ? 'null' : JSON.stringify(this.val_);
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Value.prototype.matches = function(scope) {
    return this.val_;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Value.prototype.query = function(scope) {
    return scope.query().value(this.val_);
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Value.prototype.serialize = function(serializer) {
    return {op: 'value', x: serializer.serializeValue(this.val_)};
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Value.prototype.makeLookup = function(scope) {
    var v = (/** @type {recoil.db.expr.Value} */ (this)).eval(scope);
    return [{'': v}];
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.Value}
 */
recoil.db.expr.Value.deserialize = function(data, serializer) {
    return new recoil.db.expr.Value(serializer.deserializeValue(data.x));
};

/**
 * @constructor
 * @param {!recoil.db.QueryExp} field this can be a dot seperated and use [] to acces arrays or maps
 * @param {RegExp|string} pattern the pattern to match
 * @param {?string=} opt_options extra options for matching only used when pattern is a string
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.RegExp = function(field, pattern, opt_options) {

    this.field_ = field;

    if (pattern instanceof RegExp) {

        this.pattern_ = pattern;
    }
    else {
        this.pattern_ = new RegExp(pattern, opt_options);
    }
};
/**
 * @return {string}
 */
recoil.db.expr.RegExp.prototype.toString = function() {
    return 'regex(' + this.field_.toString() + ',' + this.pattern_.toString() + ')';
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.RegExp.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.RegExp.prototype.eval = function(scope) {
    return this.field_.eval(scope).search(this.pattern_) !== -1;
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.RegExp.prototype.serialize = function(serializer) {
    return {op: 'reg', field: this.field_, pat: this.pattern_};
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {?}
 */
recoil.db.expr.RegExp.prototype.matches = function(scope) {
    return undefined;
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.RegExp} ;
 */
recoil.db.expr.RegExp.deserialize = function(data, serializer) {
    return new recoil.db.expr.RegExp(recoil.db.Query.deserializeExp(data.field, serializer), data.pat);
};



/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.RegExp.prototype.query = function(scope) {
    throw 'Not implemented yet';
};

/**
 * @constructor
 * @param {string} expr
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Where = function(expr) {
    this.expr_ = recoil.db.QueryScope.mkWhere(expr);
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {boolean}
 */
recoil.db.expr.Where.prototype.eval = function(scope) {
    return scope.evalWhere(this.expr_);
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {?}
 */
recoil.db.expr.Where.prototype.matches = function(scope) {
    return undefined;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Where.prototype.query = function(scope) {
    throw 'Not implemented yet';
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Where.prototype.serialize = function(serializer) {
    throw new Error('this is dangerous we need to fix this in order to send to server');
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Where.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @constructor
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.True = function() {
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {boolean}
 */
recoil.db.expr.True.prototype.eval = function(scope) {
    return true;
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {boolean}
 */
recoil.db.expr.True.prototype.matches = function(scope) {
    return true;
};

/**
 * @return {string}
 */
recoil.db.expr.True.prototype.toString = function() {
    return 'true';
};

/**
 * generates a query for the scope
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.True.prototype.query = function(scope) {
    return scope.query().true();
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.True.prototype.serialize = function(serializer) {
    return {op: 'true'};
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {recoil.db.expr.True} ;
 */
recoil.db.expr.True.deserialize = function(data, serializer) {
    return new recoil.db.expr.True();
};


/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.True.prototype.makeLookup = function(scope) {
    return [];
};


/**
 * @constructor
 * @param {!recoil.db.expr.Field} field
 * @param {Array<!recoil.db.expr.Value>} list
 * @param {boolean} all
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Contains = function(field, list, all) {
    this.field_ = field;
    this.list_ = list;
    this.all_ = all;
};


/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Contains.prototype.serialize = function(serializer) {
    return {op: 'contains', 'all': this.all_, field: this.field_.serialize(serializer), list: this.list_.map(function(v) {return v.serialize(serializer);})};
};

/**
 * @param {?} data
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {!recoil.db.expr.Contains}
 */
recoil.db.expr.Contains.deserialize = function(data, serializer) {
    var field = recoil.db.Query.deserializeExp(data.field, serializer);
    if (!(field instanceof recoil.db.expr.Field)) {
        throw new Error('invalid field type');
    }
    return new recoil.db.expr.Contains(/** @type {!recoil.db.expr.Field} */(field), data.list.map(
        function(v) {
            return recoil.db.Query.deserializeExp(v, serializer);
        }), !!data['all']);
};

/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Contains.prototype.makeLookup = function(scope) {
    return [];
};
/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Contains.prototype.eval = function(scope) {
    var values = this.field_.eval(scope);
    var lookup = this.list_.map(function(e) {return e.eval(scope);});
    for (var j = 0; j < lookup.length; j++) {
        var l = lookup[j];
        var found = false;
        for (var i = 0; !found && i < values.length; i++) {

            if (recoil.util.isEqual(values[i], l)) {
                found = true;
                if (!this.all_) {
                    return true;
                }
            }
        }
        if (!found && this.all_) {
            return false;
        }
    }
    return this.all_;

};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Contains.prototype.matches = function(scope) {
    var values = this.field_.eval(scope);
    var lookup = this.list_.map(function(e) {return e.eval(scope);});
    for (var j = 0; j < lookup.length; j++) {
        var l = lookup[j];
        if (l === undefined) {
            return undefined;
        }
        var found = false;
        for (var i = 0; !found && i < values.length; i++) {
            if (values[i] === undefined) {
                return undefined;
            }
            if (recoil.util.isEqual(values[i], l)) {
                found = true;
                if (!this.all_) {
                    return true;
                }
            }
        }
        if (!found && this.all_) {
            return false;
        }
    }
    return this.all_;

};



/**
 * generates a query for the scope
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Contains.prototype.query = function(scope) {
    return scope.query().contains(scope, this.field_, this.list_.map(function(v) {return v.query(scope);}, this.all_));
};


/**
 * @constructor
 * @param {string} expr
 * @implements {recoil.db.QueryExp}
 */
recoil.db.expr.Search = function(expr) {
    this.expr_ = expr;
};


/**
 * returns an array of things to check to see if this matches
 * if null is return nothing can match, if empty list is return every thing
 * matches, items in array are ored, items in map are anded
 *
 * @param {!recoil.db.QueryScope} scope
 * @return {?Array<Object<string,?>>}
 */
recoil.db.expr.Search.prototype.makeLookup = function(scope) {
    return [];
};

/**
 * @param {!recoil.db.Query.Serializer} serializer
 * @return {?}
 */
recoil.db.expr.Search.prototype.serialize = function(serializer) {
    return {op: 'search', exp: this.expr_};
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Search.prototype.eval = function(scope) {
    throw 'not implemented yet';
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Search.prototype.matches = function(scope) {
    return undefined;
};


/**
 * generates a query for the scope
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Search.prototype.query = function(scope) {
    throw 'not implemented yet';
};


/**
 * default true function
 */
recoil.db.Query.True = new recoil.db.Query().True();


/**
 * @type {Object<string,function(?,recoil.db.Query.Serializer):!recoil.db.QueryExp>}
 */
recoil.db.Query.deserializeMap = (function() {
    var ns = recoil.db.expr;
    var res = {
        'null': recoil.db.Query.unaryDeserializer(ns.Null),
        '!': recoil.db.Query.unaryDeserializer(ns.Not),
        '&': recoil.db.Query.binaryDeserializer(ns.And),
        '|': recoil.db.Query.binaryDeserializer(ns.Or),
        '=': recoil.db.Query.binaryDeserializer(ns.Equals),
        '>': recoil.db.Query.binaryDeserializer(ns.GreaterThan),
        '<': recoil.db.Query.binaryDeserializer(ns.LessThan),
        '<=': recoil.db.Query.binaryDeserializer(ns.LessThanOrEquals),
        '>=': recoil.db.Query.binaryDeserializer(ns.GreaterThanOrEquals),
        'concat': ns.Concat.deserialize,
        'startsWith': ns.StartsWith.deserialize,
        'containsStr': ns.ContainsStr.deserialize,
        'contains': ns.Contains.deserialize,
        'in': ns.In.deserialize,
        '!in': ns.NotIn.deserialize,
        'reg': ns.RegExp.deserialize,
        'search': ns.Search.deserialize,
        'value': ns.Value.deserialize,
        'field': ns.Field.deserialize,
        '?': ns.Exists.deserialize,
        'raw': ns.Raw.deserialize,

        'true': function() {
            return new ns.True();
        }
    };
    return res;
})();
