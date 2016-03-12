goog.provide('recoil.util');
goog.provide('recoil.util.Handle');


goog.require('goog.object');
goog.require('goog.array');



/**
 * @template T
 * @return T
 */
recoil.util.safeFreeze = function(value) {

    if (value instanceof Object) {
        if (Object.isFrozen && !Object.isFrozen(value)) {
            var result = Object.create(value);
            Object.freeze(result);
            return result;
        }
    }
    return value;

};


/**
 * invokes function with arg1 and converts the rest array the rest of the paramters
 * 
 * @param {Object} me
 * @param {function} func
 * @param {*} arg1
 * @param {Array<*>} rest
 * 
 */
recoil.util.invokeOneParamAndArray = function (me, func, arg1, rest) {
    var params = [arg1];
    for (var i = 0; i < rest.length; i++) {
       params.push(rest[i]); 
    };
    return func.apply(me, params);
};


/**
 * will call func passing in all the arguments and converting the last
 * array parameter as more arguments
 *
 * @template T
 * @param {function(...) : T} func the function to call
 * @param {Object} obj the this parameter to call
 * @param {...} var_arguments a list of arguments the last one should be an array
 *
 *
 */
recoil.util.invokeParamsAndArray = function (func, obj, var_arguments) {
    var args = [];
    for (var i = 2; i < arguments.length -1; i++) {
        args.push(arguments[i]);

    }
    if (arguments.length > 2) {
        var arr = arguments[arguments.length -1];
        for (var i = 0; i <  arr.length; i++) {
            args.push(arr[i]);
        }
    }
    return func.apply(obj, args);
};

/**
 * compares 2 objects
 * 
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @return {!boolean}
 */
recoil.util.isEqual = function(a, b) {

    return recoil.util.isEqual.isEqualRec_(a, b, [], []);
};
/**
 * @private
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @param {Array<Object>} aPath
 * @param {Array<Object>} bPath
 * @return {!boolean}
 */
recoil.util.isEqual.isEqualRec_ = function(a, b, aPath, bPath) {

    // check for loops

    var aIndex = goog.array.indexOf(aPath, a);
    var bIndex = goog.array.indexOf(bPath, b);

    if (aIndex !== -1 || bIndex !== -1) {
        return aIndex === bIndex;
    }

    if (a === b) {
        return true;
    }

    if (a === undefined || b === undefined || a === null || b === null) {
        return false;
    }

    if (a.equals !== undefined && a.equals instanceof Function) {
        return a.equals(b);
    }
    if (b.equals !== undefined && b.equals instanceof Function) {
        return b.equals(a);
    }

    if (goog.isArrayLike(a) != goog.isArrayLike(b)) {
        return false;
    }

    var newAPath = goog.array.concat(aPath, [a]);
    var newBPath = goog.array.concat(bPath, [b]);

    if (goog.isArrayLike(a)) {

        return goog.array.equals(/** @type {goog.array.ArrayLike} */
        (a), /** @type {goog.array.ArrayLike} */
        (b), function(a, b) {
            return recoil.util.isEqual.isEqualRec_(a, b, newAPath, newBPath);
        });
    }

    if (a instanceof Object || b instanceof Object) {
        if (!(a instanceof Object) || !(b instanceof Object)) {
            return false;
        }

        for ( var k in a) {
            if (!(k in b) || !recoil.util.isEqual.isEqualRec_(a[k], b[k], newAPath, newBPath)) {
                return false;
            }
        }
        for ( var k in b) {
            if (!(k in a)) {
                return false;
            }
        }
        return true;
    }
    return false;
};

/**
 * @template T
 * @param {T=} opt_value
 * @constructor
 */
recoil.util.Handle = function(opt_value) {
  this.value_ = opt_value;
};
/**
 *
 * @param {T} value
 */
recoil.util.Handle.prototype.set = function (value) {
   this.value_ = value;
};

/**
 * @returns {T}
 */
recoil.util.Handle.prototype.get = function () {
    return this.value_;
};
