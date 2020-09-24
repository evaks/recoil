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
 * @param {string} value
 * @param {!Array<string>} list
 * @return {string}
 */
recoil.db.SQLQueryHelper.prototype.in = function(value, list) {
    return '(' + value + ' IN (' + list.join(', ') + '))';
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
recoil.db.SQLQueryHelper.prototype.equals = function(x, y) {
    return '(' + x + ' = ' + y + ')';

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
 * generates a query for the scope
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.QueryExp.prototype.query = function(scope) {};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.QueryExp.prototype.serialize = function(colSerializer) {};
/**
 * @constructor
 * @param {Object} map
 * @param {!recoil.db.QueryHelper=} opt_helper note if you don't provide this query will not work
 */
recoil.db.QueryScope = function(map, opt_helper) {
    this.map_ = map;
    this.query_ = opt_helper;
    /**
     * @type {Object<string,!Array<string>>}
     */
    this.colKeyMap_ = {};
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
 */
recoil.db.DBQueryScope = function(map, helper) {
    recoil.db.QueryScope.call(this, map, helper);
    this.dbMap_ = {children: {}, table: null};
    this.colMap_ = {};
};
goog.inherits(recoil.db.DBQueryScope, recoil.db.QueryScope);

/**
 * @param {!Array<string>} path
 * @param {string} table
 * @param {!Array<!recoil.structs.table.ColumnKey>} columns
*/
recoil.db.DBQueryScope.prototype.addPathTable = function(path, table, columns) {
    var cur = this.dbMap_;
    for (var i = 0; i < path.length; i++) {
        var item = path[i];
        var next = cur.children[item];
        if (!next) {
            next = {table: null, children: {}};
            cur.children[item] = next;
        }
        cur = next;
    }
    cur.table = table;
    var me = this;
    columns.forEach(function(c) {
        me.colMap_[c.getId()] = table;
    });
};

/**
 * @param {!Array<string|!recoil.structs.table.ColumnKey>} parts indexes to get the object
 * @return {{field:(!Array<string>|undefined),value:(?|undefined)}}
 */
recoil.db.DBQueryScope.prototype.resolve = function(parts) {
    var cur = this.dbMap_;
    if (parts.length === 0) {
        throw 'No parts in path specified';
    }
    if (parts.length == 1 && typeof(parts[0]) === 'string' && this.map_.hasOwnProperty(parts[0])) {

        return {value: this.map_[parts[0]]};
    }

    if (parts.length === 1 && parts[0] instanceof recoil.structs.table.ColumnKey) {

        var table = this.colMap_[parts[0].getId()];
        if (!table) {
            return {field: [parts[0].getName()]};
        }
        return {field: [table, parts[0].getName()]};
    }
    for (var i = 0; i < parts.length - 1 && cur; i++) {
        cur = cur.children[parts[i]];
    }
    var tbl = cur ? cur.table : null;
    if (tbl === '' && parts.length === 1) {
        // if we only have one table this is ok
        return {field: [parts[parts.length - 1]]};
    }

    if (!tbl) {
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

    for (var i = 0; i < parts.length; i++) {
        if (curScope instanceof Object) {
            curScope = curScope[parts[i]];
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
 * @constructor
 * @param {{count:(boolean|undefined), sortOrder:(Array|undefined), rate:(number|undefined),size:(undefined|number)}=} opt_options
 */
recoil.db.QueryOptions = function(opt_options) {
    this.options_ = opt_options || {};
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
 * @return {{next:?, page:number}}
 */
recoil.db.QueryOptions.prototype.start = function() {
    return this.options_.start;
};

/**
 * @return {?Array<!recoil.db.Query>}
 */
recoil.db.QueryOptions.prototype.sortOrder = function() {
    return this.options_.start;
};


/**
 * @return {?}
 */
recoil.db.QueryOptions.prototype.serialize = function() {
    return this.options_;
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
 *
 * @param {?} cls
 * @return {function(?, function(?):!recoil.structs.table.ColumnKey):recoil.db.QueryExp} ;
 */

recoil.db.Query.binaryDeserializer = function(cls) {
    return function(data, colDeserializer) {
        return new cls(recoil.db.Query.deserializeExp(data.x, colDeserializer), recoil.db.Query.deserializeExp(data.y, colDeserializer));
    };
};
/**
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.Query}
 */
recoil.db.Query.deserialize = function(data, colDeserializer) {
    var factory = recoil.db.Query.deserializeMap[data.op];

    if (!factory) {
        throw new Error('Unknown Expression Type ' + data.op);
    }

    return new recoil.db.Query(factory(data, colDeserializer));
};

/**
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.QueryExp}
 */
recoil.db.Query.deserializeExp = function(data, colDeserializer) {
    var factory = recoil.db.Query.deserializeMap[data.op];

    if (!factory) {
        throw new Error('Unknown Expression Type ' + data.op);
    }

    return factory(data, colDeserializer);
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.query = function(scope) {
    return this.expr_.query(scope);
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.eval = function(scope) {
    return this.expr_.eval(scope);
};

/**
 * returns a basic object that can stringified and sent over the wire
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.Query.prototype.serialize = function(colSerializer) {
    return this.expr_.serialize(colSerializer);
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
 * @param {recoil.db.Query|recoil.db.QueryExp=} opt_x
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
 * @param {string|!recoil.structs.table.ColumnKey} field
 * @return {!recoil.db.Query}
 */

recoil.db.Query.prototype.field = function(field) {
    return this.query_(new recoil.db.expr.Field(field));
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
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.And.prototype.query = function(scope) {
    return scope.query().and(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.And.prototype.serialize = function(colSerializer) {
    return {op: '&', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Or.prototype.query = function(scope) {
    return scope.query().or(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Or.prototype.serialize = function(colSerializer) {
    return {op: '|', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Not.prototype.eval = function(scope) {
    return !this.x_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Not.prototype.query = function(scope) {
    return scope.query().not(this.x_.query(scope));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Not.prototype.serialize = function(colSerializer) {
    return {op: '!', x: this.x_.serialize(colSerializer)};
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
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Exists.prototype.serialize = function(colSerializer) {
    return {op: '?', x: this.val_.serialize(colSerializer), exists: this.exists_};
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
    return this.x_.eval(scope) === this.y_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Equals.prototype.query = function(scope) {
    return scope.query().equals(this.x_.query(scope), this.y_.query(scope));
};


/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Equals.prototype.serialize = function(colSerializer) {
    return {op: '=', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) !== this.y_.eval(scope);
};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.NotEquals.prototype.query = function(scope) {
    return scope.query().notEquals(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.NotEquals.prototype.serialize = function(colSerializer) {
    return {op: '!=', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.GreaterThan.prototype.serialize = function(colSerializer) {
    return {op: '>', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.serialize = function(colSerializer) {
    return {op: '>=', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.GreaterThanOrEquals.prototype.query = function(scope) {
    return scope.query().greaterThanOrEqual(this.x_.query(scope), this.y_.query(scope));
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
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.LessThan.prototype.serialize = function(colSerializer) {
    return {op: '<', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThanOrEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) <= this.y_.eval(scope);
};


/**
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.LessThanOrEquals.prototype.query = function(scope) {
    return scope.query().lessThanOrEqual(this.x_.query(scope), this.y_.query(scope));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.LessThanOrEquals.prototype.serialize = function(colSerializer) {
    return {op: '<=', x: this.x_.serialize(colSerializer), y: this.y_.serialize(colSerializer)};
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
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.expr.In}
 */
recoil.db.expr.In.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.In(recoil.db.Query.deserializeExp(data.field, colDeserializer), data.list.map(
        function(v) {
            return recoil.db.Query.deserializeExp(v, colDeserializer);
        }));
};


/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.In.prototype.serialize = function(colSerializer) {
    return {op: 'in', field: this.field_.serialize(colSerializer), list: this.list_.map(function(v) {return v.serialize(colSerializer);})};
};

/**
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.In.prototype.eval = function(scope) {
    var v = this.field_.eval(scope);
    var list = this.list_.map(function(v) {return v.eval(scope);});
    var res = list.indexOf(v) !== -1;
    return res;

};


/**
 * @param {!recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.In.prototype.query = function(scope) {
    return scope.query().in (this.field_.query(scope), this.list_.map(function(v) { return v.query(scope); }));
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
    return this.list_.map(function(v) {return v.eval(scope);}).indexOf(v) === -1;
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
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.expr.NotIn}
 */
recoil.db.expr.NotIn.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.NotIn(recoil.db.Query.deserializeExp(data.field, colDeserializer), data.list.map(
        function(v) {
            return recoil.db.Query.deserializeExp(v, colDeserializer);
        }));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.NotIn.prototype.serialize = function(colSerializer) {
    return {op: '!in', field: this.field_.serialize(colSerializer), list: this.list_.map(function(v) {return v.serialize(colSerializer);})};
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
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.expr.Field}
 */
recoil.db.expr.Field.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.Field(data.parts.map(
        function(v, idx) {
            if (idx === 0 && v.path) {
                return colDeserializer(v.path);
            }
            return v;
        }));
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Field.prototype.serialize = function(colSerializer) {
    return {op: 'field', parts: this.parts_.map(

        function(v) {
            if (typeof(v) === 'string') {
                return v;
            }

            return {path: colSerializer(v)};

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
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.Value.prototype.query = function(scope) {
    return scope.query().value(this.val_);
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Value.prototype.serialize = function(colSerializer) {
    return {op: 'value', x: this.val_};
};

/**
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.expr.Value}
 */
recoil.db.expr.Value.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.Value(data.x);
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
 * @param {!recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.RegExp.prototype.eval = function(scope) {
    return this.field_.eval(scope).search(this.pattern_) !== -1;
};


/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.RegExp.prototype.serialize = function(colSerializer) {
    return {op: 'reg', field: this.field_, pat: this.pattern_};
};

/**
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {!recoil.db.expr.RegExp} ;
 */
recoil.db.expr.RegExp.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.RegExp(recoil.db.Query.deserializeExp(data.field, colDeserializer), data.pat);
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
 * @return {string}
 */
recoil.db.expr.Where.prototype.query = function(scope) {
    throw 'Not implemented yet';
};


/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Where.prototype.serialize = function(colSerializer) {
    throw new Error('this is dangerous we need to fix this in order to send to server');
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
 * generates a query for the scope
 * @param {recoil.db.QueryScope} scope
 * @return {string}
 */
recoil.db.expr.True.prototype.query = function(scope) {
    return scope.query().true();
};

/**
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.True.prototype.serialize = function(colSerializer) {
    return {op: 'true'};
};

/**
 * @param {?} data
 * @param {function(?):!recoil.structs.table.ColumnKey} colDeserializer
 * @return {recoil.db.expr.True} ;
 */
recoil.db.expr.True.deserialize = function(data, colDeserializer) {
    return new recoil.db.expr.True();
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
 * @param {function(!recoil.structs.table.ColumnKey)} colSerializer
 * @return {?}
 */
recoil.db.expr.Search.prototype.serialize = function(colSerializer) {
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
 * @type {Object<string,function(?,function(?):!recoil.structs.table.ColumnKey):!recoil.db.QueryExp>}
 */
recoil.db.Query.deserializeMap = (function() {
    var ns = recoil.db.expr;
    var res = {
        '&': recoil.db.Query.binaryDeserializer(ns.And),
        '|': recoil.db.Query.binaryDeserializer(ns.Or),
        '=': recoil.db.Query.binaryDeserializer(ns.Equals),
        '>': recoil.db.Query.binaryDeserializer(ns.GreaterThan),
        '<': recoil.db.Query.binaryDeserializer(ns.LessThan),
        '<=': recoil.db.Query.binaryDeserializer(ns.GreaterThanOrEquals),
        '>=': recoil.db.Query.binaryDeserializer(ns.LessThanOrEquals),
        'in': ns.In.deserialize,
        '!in': ns.NotIn.deserialize,
        'reg': ns.RegExp.deserialize,
        'search': ns.Search.deserialize,
        'value': ns.Value.deserialize,
        'field': ns.Field.deserialize,
        '?': ns.Exists.deserialize,
        'true': function() {
            return new ns.True();
        }
    };
    return res;
})();
