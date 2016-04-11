goog.provide('recoil.db.Query');
goog.provide('recoil.db.QueryExp');
goog.provide('recoil.db.QueryScope');
goog.provide('recoil.db.expr.And');
goog.provide('recoil.db.expr.Or');
goog.provide('recoil.db.expr.Not');
goog.provide('recoil.db.expr.Exists');

goog.provide('recoil.db.expr.Equals');
goog.provide('recoil.db.expr.NotEquals');
goog.provide('recoil.db.expr.GreaterThan');
goog.provide('recoil.db.expr.GreaterThanEquals');
goog.provide('recoil.db.expr.LessThan');
goog.provide('recoil.db.expr.LessThanEquals');
goog.provide('recoil.db.expr.In');
goog.provide('recoil.db.expr.NotIn');
goog.provide('recoil.db.expr.Field');

goog.provide('recoil.db.expr.RexExp');
goog.provide('recoil.db.expr.Expr');


/**
 * @interface 
 */
recoil.db.QueryExp = function () {};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.QueryExp.prototype.eval = function (scope) {
    
};

/**
 * @constructor
 * @param {Object} map
 */
recoil.db.QueryScope = function (map) {
    this.map_ = map;
};
/**
 * @param {string} expr  expressoin to eval
 */
recoil.db.QueryScope.prototype.eval = function (exp) {
    var scopedExp = "function (scope) {'use strict';";
    // this might not work for things with keys like strings

    var args = [];
    var vals = [];
    for (var p in this.map_) {
	args.push(p);
	vals.push(this.map_[p]);
    }

    args.push("'use strict'; return " + exp + ";");
    
    var f = Function.constructor.apply(null, args);
    return f.apply(null, args);
};
/**
 * makes a query, this is utility class for building up expression
 * that can be sent to the database to filter requests
 *
 *@constructor
 *@param {?recoil.db.QueryExp} opt_expr
 */
recoil.db.Query = function (opt_expr) {
    this.expr_ = opt_expr || null;
};

/**
 * applies variable number operators together to the function
 * @private
 * @param {function(*,*)} constructor 
 * @param {Array<recoil.db.Query|recoil.db.QueryExp>} args
 * @return recoil.db.Query
 */

recoil.db.Query.prototype.chain_ = function (constructor, args) {
    if (this.expr_ === null && args.length === 0)  {
	throw "Not enought parameters";
    }
    var start = args.length - 2;
    var cur = args.length > 0 ? this.toExpr(args[args.length - 1]) : this.expr_;

    for (var i = start; i >= 0; i--) {
	cur = new constructor( this.toExpr(args[i]), cur);
    }

    if (this.expr_ !== null && args.length > 0) {
	cur = new recoil.db.expr.And(this.expr_, cur);
    }
    this.expr_ = cur;
    return new recoil.db.Query(cur);
    
};
/**
 * ands together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(recoil.db.Query|recoil.db.QueryExp)} var_others
 * @return recoil.db.Query
 */
recoil.db.Query.prototype.and (var_others) {
    return this.chain_(recoil.db.expr.And, arguments);
};

/**
 * ors together all the arguments, and the current query
 * if the curernt query is not null also includes that query
 * @param {...(recoil.db.Query|recoil.db.QueryExp)} var_others
 * @return recoil.db.Query
 */
recoil.db.Query.prototype.or (var_others) {
    return this.chain_(recoil.db.expr.Or, arguments);
};

/**
 * @param {recoil.db.Query|recoil.db.QueryExp} opt_x
 * @return recoil.db.Query
 */
recoil.db.Query.prototype.not (opt_x) {
    var x = opt_x;
    if (opt_x === undefined) {
	x = this.expr_;
    }
    this.expr_ = new recoil.db.expr.Not(this.toExpr(x)); 
    return this.expr_;
};


/**
 * convert a query or an expression to an expression
 * @param {recoil.db.Query|recoil.db.QueryExp} exp
 * @return {recoil.db.QueryExp}
 */
recoil.db.Query.prototype.toExpr = function (exp) {
    if (exp instanceof recoil.db.Query) {
	return exp.expr_;
    }
    return exp;
};

/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.And = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.And.prototype.eval(scope) {
    return this.x_.eval(scope) && this.y_.eval(scope);
};


/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Or = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.Or.prototype.eval(scope) {
    return this.x_.eval(scope) || this.y_.eval(scope);
};



/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Not = function (x) {
    this.x_ = x;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.Not.prototype.eval(scope) {
    return !this.x_.eval(scope);
};

goog.provide('recoil.db.expr.Exists');



/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Equals = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.Equals.prototype.eval(scope) {
    return this.x_.eval(scope) === this.y_.eval(scope);
};



/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.NotEquals = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.NotEquals.prototype.eval(scope) {
    return this.x_.eval(scope) !== this.y_.eval(scope);
};



/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.GreaterThan = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.GreaterThan.prototype.eval(scope) {
    return this.x_.eval(scope) > this.y_.eval(scope);
};


/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.GreaterThanEquals = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.GreaterThanEquals.prototype.eval(scope) {
    return this.x_.eval(scope) >= this.y_.eval(scope);
};


/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.LessThan = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.LessThan.prototype.eval(scope) {
    return this.x_.eval(scope) < this.y_.eval(scope);
};


/**
 * @constructor
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.LessThanEquals = function (x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.LessThanEquals.prototype.eval(scope) {
    return this.x_.eval(scope) <= this.y_.eval(scope);
};


/**
 * @constructor
 * @param {*} x
 * @param {Array<*> list
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.In = function (x, list) {
    this.x_ = x;
    this.list_ = list;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.In.prototype.eval(scope) {
    var x = this.x_.eval(scope);
    for (var i = 0; i < this.list_.length; i++) {
	if (x === this.list_[i].eval(scope)) {
	    return true;
	}
    }
    return false;
};



/**
 * @constructor
 * @param {*} x
 * @param {Array<*> list
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.NotIn = function (x, list) {
    this.x_ = x;
    this.list_ = list;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.NotIn.prototype.eval(scope) {
    var x = this.x_.eval(scope);
    for (var i = 0; i < this.list_.length; i++) {
	if (x === this.list_[i].eval(scope)) {
	    return false;
	}
    }
    return true;
};


/**
 * @constructor
 * @param {string} name this can be a dot seperated and use [] to acces arrays or maps
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Field = function (name) {
    this.name_ = name;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.Field.prototype.eval(scope) {
    return scope.eval(this.name_);
};


/**
 * @constructor
 * @param {string} field this can be a dot seperated and use [] to acces arrays or maps
 * @param {RegExp|string} the pattern to match
 * @param {?string} opt_pattern extra options for matching only used when pattern is a string
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.RegExp = function (field, pattern, opt_options) {
  
    this.field_ = field;
    if (pattern instanceof RegExp) {
	
	this.pattern_ = pattern;
    }
    else {
	this.pattern_ = new RegExp(pattern, opt_options);
    }
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.RegExp.prototype.eval(scope) {
    return scope.eval(this.field_).search(this.pattern_) !== -1;
};



/**
 * @constructor
 * @param {string} expr 
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Expr = function (expr) {
    this.expr_ = expr;
};

/**
 * @param {recoil.db.QueryScope} scope
 * @return *
 */
recoil.db.expr.Expr.prototype.eval(scope) {
    return scope.eval(this.expr_);
};


/**
 * @constructor
 * @param {string} expr 
 * @implements recoil.db.QueryExp
 */
recoil.db.expr.Search = function (expr) {
    this.expr_ = expr;
};
