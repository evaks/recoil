goog.provide('recoil.db.Query');
goog.provide('recoil.db.QueryExp');
goog.provide('recoil.db.QueryOptions');
goog.provide('recoil.db.QueryScope');
goog.provide('recoil.db.expr.And');
goog.provide('recoil.db.expr.Equals');
goog.provide('recoil.db.expr.Exists');
goog.provide('recoil.db.expr.Field');
goog.provide('recoil.db.expr.GreaterThan');
goog.provide('recoil.db.expr.GreaterThanEquals');
goog.provide('recoil.db.expr.In');
goog.provide('recoil.db.expr.LessThan');
goog.provide('recoil.db.expr.LessThanEquals');
goog.provide('recoil.db.expr.Not');
goog.provide('recoil.db.expr.NotEquals');
goog.provide('recoil.db.expr.NotIn');
goog.provide('recoil.db.expr.Or');
goog.provide('recoil.db.expr.RexExp');
goog.provide('recoil.db.expr.Value');
goog.provide('recoil.db.expr.Where');


/**
 * @interface
 */
recoil.db.QueryExp = function() {};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.QueryExp.prototype.eval = function(scope) {

};

/**
 * @constructor
 * @param {Object} map
 */
recoil.db.QueryScope = function(map) {
    this.map_ = map;
};
/**
 * @private
 * @param {string} str
 * @return {string}
 */
recoil.db.QueryScope.stripQuotes_ = function(str) {
    if (str.length > 1
        && ((str.startsWith("'") && str.endsWith("'"))
            || (str.startsWith('\"') && str.endsWith('\"')))) {

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
 * @param {Array<string>} parts indexes to get the object
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
 * @return {*}
 */
recoil.db.QueryScope.mkWhere = function(exp) {
    // this might not work for things with keys like strings

    var args = ['obj'];
    exp = exp.trim();
    if (exp.startsWith('function')) {

        args.push("'use strict'; return (" + exp + ')();');
    }
    else {
        args.push("'use strict'; return (" + exp + ');');
    }

    return Function.constructor.apply(null, args);
};


/**
 * @param {function(Object):boolean} func precompiled function
 * @return {*}
 */
recoil.db.QueryScope.prototype.evalWhere = function(func) {
    // this might not work for things with keys like strings

    var vals = [this.map_];

    return func.apply(this.map_, vals);
};


/**
 * @constructor
 * @param {number} pollRate milliseconds between polls <0 means notify, if not
 * @param {Object} extra
 */
recoil.db.QueryOptions = function(pollRate, extra) {
    this.pollRate_ = pollRate;
};

/**
 * makes a query, this is utility class for building up expression
 * that can be sent to the database to filter requests
 *
 * @constructor
 * @param {?recoil.db.QueryExp} opt_expr
 */
recoil.db.Query = function(opt_expr) {
    this.expr_ = opt_expr || null;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.Query.prototype.eval = function(scope) {
    return this.expr_.eval(scope);
};

/**
 * applies variable number operators together to the function
 * @private
 * @template T
 * @param {function(new:T,...(!recoil.db.Query|!recoil.db.QueryExp)):recoil.db.Query|
          function (new:T,!recoil.db.QueryExp,!recoil.db.QueryExp)} constructor
 * @param {IArrayLike<recoil.db.Query|recoil.db.QueryExp>} args
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.chain_ = function(constructor, args) {
    if (this.expr_ === null && args.length === 0) {
        throw 'Not enought parameters';
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
 * @param {recoil.db.Query} query
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.set_ = function(query) {
    this.expr_ = query;
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
 * @param {...(recoil.db.Query|recoil.db.QueryExp)} var_others
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.and$ = function(var_others) {
    return this.set_(this.chain_(recoil.db.expr.And, arguments));
};

/**
 * ands together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(recoil.db.Query|recoil.db.QueryExp)} var_others
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.and = function(var_others) {
    return this.chain_(recoil.db.expr.And, arguments);
};

/**
 * ors together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(recoil.db.Query|recoil.db.QueryExp)} var_others
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.or = function(var_others) {
    return this.chain_(recoil.db.expr.Or, arguments);
};

recoil.db.Query.prototype.or$ = function(var_others) {
    return this.set_(this.chain_(recoil.db.expr.Or, arguments));
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp} opt_x
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.not = function(opt_x) {
    var x = opt_x;
    if (opt_x === undefined) {
        x = this.expr_;
    }
    return this.query_(new recoil.db.expr.Not(this.toExpr(x)));
};

recoil.db.Query.prototype.not$ = function(opt_x) {
    return this.set_(this.not(opt_x));
};

recoil.db.Query.prototype.val = function(val) {
    return this.query_(new recoil.db.expr.Value(val));
};

recoil.db.Query.prototype.field = function(field) {
    return this.query_(new recoil.db.expr.Field(field));
};

recoil.db.Query.prototype.field$ = function(field) {
    return this.set_(this.field(field));
};
/**
 * checks if a field exists in the object
 * nulls and undefined exist
 * @param {string} field
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.exists = function(field) {
    return this.query_(new recoil.db.expr.Exists(field, true));
};
/**
 * checks if a field exists in the object, also sets the result to this query
 * nulls and undefined exist
 * @param {string} field
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.exists$ = function(field) {
    return this.set_(this.exists(field));
};


/**
 * this is not called equals because that should compare to queries
 * @param {*} left
 * @param {*} right
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
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.neq = function(left, right) {
    return this.query_(new recoil.db.expr.NotEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * nulls and undefined exist
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.neq$ = function(left, right) {
    return this.set_(this.neq(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.lt = function(left, right) {
    return this.query_(new recoil.db.expr.LessThan(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.lt$ = function(left, right) {
    return this.set_(this.lt(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.lte = function(left, right) {
    return this.query_(new recoil.db.expr.LessThanEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.lte$ = function(left, right) {
    return this.set_(this.lte(left, right));
};



/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.gt = function(left, right) {
    return this.query_(new recoil.db.expr.GreaterThan(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.gt$ = function(left, right) {
    return this.set_(this.gt(left, right));
};


/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.gte = function(left, right) {
    return this.query_(new recoil.db.expr.GreaterThanEquals(this.toExpr(left), this.toExpr(right)));
};
/**
 * @param {*} left
 * @param {*} right
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.gte$ = function(left, right) {
    return this.set_(this.gte(left, right));
};

/**
 * checks if a field does not exists in the object
 * nulls and undefined exist
 * @param {string} field
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.notExists = function(field) {
    return this.query_(new recoil.db.expr.Exists(field, false));
};
/**
 * checks if a field does not exist in the object, also sets the result to this query
 * nulls and undefined exist
 *
 * @param {string} field
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.notExists$ = function(field) {
    return this.set_(this.notExists(field));
};

/**
 * runs a boolean javascript expression on each object
 * the current object can be referenced via this, or obj
 * @param {string} expr
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.where = function(expr) {
    return this.query_(new recoil.db.expr.Where(expr));
};
/**
 * runs a boolean javascript expression on each object
 * the current object can be referenced via this, or obj
 * @param {string} expr
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.where$ = function(expr) {
    return this.set_(this.where(expr));
};



/**
 * @param {string} field
 * @param {string|RegExp} pattern
 * @param {?string} opt_options
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.regex = function(field, pattern, opt_options) {
    return this.query_(new recoil.db.expr.RegExp(field, pattern, opt_options));
};
/**
 * @param {string} field
 * @param {string|RegExp} pattern
 * @param {?string} opt_options
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.regex$ = function(field, pattern, opt_options) {
    return this.set_(this.regex(field, pattern, opt_options));
};

/**
 * @param {string} field
 * @param {Array<*>} values
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.isIn = function(field, values) {
    return this.query_(new recoil.db.expr.In(field, values));
};
/**
 * @param {string} field
 * @param {Array<*>} values
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.isIn$ = function(field, values) {
    return this.set_(this.isIn(field, values));
};

/**
 * @param {string} field
 * @param {Array<*>} values
 * @return {recoil.db.Query}
 */
recoil.db.Query.prototype.notIn = function(field, values) {
    return this.query_(new recoil.db.expr.NotIn(field, values));
};
/**
 * @param {string} field
 * @param {Array<*>} values
 * @return {recoil.db.Query}
 */

recoil.db.Query.prototype.notIn$ = function(field, values) {
    return this.set_(this.notIn(field, values));
};

/**
 * convert a query or an expression to an expression
 * @param {recoil.db.Query|recoil.db.QueryExp|*} exp
 * @return {!recoil.db.QueryExp}
 */
recoil.db.Query.prototype.toExpr = function(exp) {
    if (exp instanceof recoil.db.Query) {
        return exp.expr_;
    }
    if (exp instanceof String) {
        return new recoil.db.expr.Field(exp.toString());
    }
    if (typeof(exp) === 'string') {
        return new recoil.db.expr.Field(exp.toString());
    }

    if (exp instanceof Object) {
        return exp;
    }

    return new recoil.db.expr.Value(exp);
};

/**
 * @constructor
 * @implements recoil.db.QueryExp
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 */
recoil.db.expr.And = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.And.prototype.eval = function(scope) {
    return this.x_.eval(scope) && this.y_.eval(scope);
};


/**
 * @constructor
 * @implements recoil.db.QueryExp
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 */
recoil.db.expr.Or = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Or.prototype.eval = function(scope) {
    return this.x_.eval(scope) || this.y_.eval(scope);
};



/**
 * @constructor
 * @implements recoil.db.QueryExp
 * @param {recoil.db.QueryExp} x
 */
recoil.db.expr.Not = function(x) {
    this.x_ = x;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Not.prototype.eval = function(scope) {
    return !this.x_.eval(scope);
};

/**
 * @constructor
 * @param {string} field
 * @param {boolean} exists
 * @implements recoil.db.QueryExp
 */

recoil.db.expr.Exists = function(field, exists) {
    this.parts_ = recoil.db.QueryScope.parts(field);
    this.exists_ = exists;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Exists.prototype.eval = function(scope) {
    return scope.exists(this.parts_) === this.exists_;
};


/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Equals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Equals.prototype.eval = function(scope) {
    return this.x_.eval(scope) === this.y_.eval(scope);
};



/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.NotEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) !== this.y_.eval(scope);
};



/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.GreaterThan = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThan.prototype.eval = function(scope) {
    return this.x_.eval(scope) > this.y_.eval(scope);
};


/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.GreaterThanEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.GreaterThanEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) >= this.y_.eval(scope);
};


/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.LessThan = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThan.prototype.eval = function(scope) {
    return this.x_.eval(scope) < this.y_.eval(scope);
};


/**
 * @constructor
 * @param {recoil.db.QueryExp} x
 * @param {recoil.db.QueryExp} y
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.LessThanEquals = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.LessThanEquals.prototype.eval = function(scope) {
    return this.x_.eval(scope) <= this.y_.eval(scope);
};


/**
 * @constructor
 * @param {string} field
 * @param {Array<*>} list
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.In = function(field, list) {
    this.field_ = recoil.db.QueryScope.parts(field);
    this.list_ = list;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.In.prototype.eval = function(scope) {
    var v = scope.get(this.field_);
    return this.list_.indexOf(v) !== -1;
};



/**
 * @constructor
 * @param {string} field
 * @param {Array<*>} list
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.NotIn = function(field, list) {
    this.field_ = recoil.db.QueryScope.parts(field);
    this.list_ = list;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.NotIn.prototype.eval = function(scope) {
    var v = scope.get(this.field_);
    return this.list_.indexOf(v) === -1;
};


/**
 * @constructor
 * @param {string} name this can be a dot seperated and use [] to acces arrays or maps
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Field = function(name) {
    this.parts_ = recoil.db.QueryScope.parts(name);
    if (this.parts_.length === 0) {
        throw "invalid field '" + name + "'";
    }
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Field.prototype.eval = function(scope) {
    return scope.get(this.parts_);
};


/**
 * @constructor
 * @param {*} val
 * @implements recoil.db.QueryExp
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
 * @constructor
 * @param {string} field this can be a dot seperated and use [] to acces arrays or maps
 * @param {RegExp|string} pattern the pattern to match
 * @param {?string} opt_options extra options for matching only used when pattern is a string
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.RegExp = function(field, pattern, opt_options) {

    this.field_ = recoil.db.QueryScope.parts(field);

    if (pattern instanceof RegExp) {

        this.pattern_ = pattern;
    }
    else {
        this.pattern_ = new RegExp(pattern, opt_options);
    }
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.RegExp.prototype.eval = function(scope) {
    return scope.get(this.field_).search(this.pattern_) !== -1;
};



/**
 * @constructor
 * @param {string} expr
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Where = function(expr) {
    this.expr_ = recoil.db.QueryScope.mkWhere(expr);
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return {*}
 */
recoil.db.expr.Where.prototype.eval = function(scope) {
    return scope.evalWhere(this.expr_);
};


/**
 * @constructor
 * @param {string} expr
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Search = function(expr) {
    this.expr_ = expr;
};
