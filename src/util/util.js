goog.provide('recoil.util');

goog.require('recoil.util.Sequence');
goog.require('recoil.util.object');
goog.require('recoil.util.func');
goog.require('recoil.util.map');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
recoil.util.safeFreeze = recoil.util.object.safeFreeze;


/**
 * a generic compare function that should handle anything
 *
 * @param {*} a
 * @param {*} b
 * @return {!number}
 */
recoil.util.compare = function(a, b) {
    return recoil.util.object.compare(a, b);
};

/**
 * invokes function with arg1 and converts the rest array the rest of the paramters
 *
 * @template T
 * @template F
 * @param {Object} me
 * @param {F} func
 * @param {*} arg1
 * @param {Array<*>} rest
 * @return {T}
 */
recoil.util.invokeOneParamAndArray = recoil.util.func.invokeOneParamAndArray;



/**
 * will call func passing in all the arguments and converting the last
 * array parameter as more arguments
 *
 * @template T
 * @param {function(...) : T} func the function to call
 * @param {Object} obj the this parameter to call
 * @param {...} var_arguments a list of arguments the last one should be an array
 *
 * @return {T}
 */
recoil.util.invokeParamsAndArray = recoil.util.func.invokeParamsAndArray;


/**
 * a generic compare function that should handle anything
 *
 * @param {*} a
 * @param {*} b
 * @return {!number}
 */
recoil.util.compare = recoil.util.object.compare;

/**
 * compares 2 objects
 *
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @return {!boolean}
 */
recoil.util.isEqual = recoil.util.object.isEqual;

/**
 * checks to see if any of the items are null, if so throws an exception
 * this is needed because the closure compiler does type check for nulls however
 * code such as:
 * constructor
 *    x = null;
 * latter:
 *    x = new X();
 *    foo(x)
 * gives an error since x can be null
 *
 * @param {!IArrayLike} args
 */
recoil.util.notNull = function(args)  {
    var i;
    for (i = 0; i < args.length; i++) {
        if (args[i] === null) {
            throw 'parameter ' + i + ' cannot be null';
        }
    }
};
