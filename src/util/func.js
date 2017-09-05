goog.provide('recoil.util.func');


/**
 * invokes function with arg1 and converts the rest array the rest of the paramters
 *
 * @template T
 * @template F
 * @param {Object} me
 * @param {F} func
 * @param {*} arg1
 * @param {!IArrayLike<*>} rest
 * @return {T}
 */
recoil.util.func.invokeOneParamAndArray = function(me, func, arg1, rest) {
    var params = [arg1];
    for (var i = 0; i < rest.length; i++) {
        params.push(rest[i]);
    }
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
 * @return {T}
 */
recoil.util.func.invokeParamsAndArray = function(func, obj, var_arguments) {
    var args = [];
    for (var i = 2; i < arguments.length - 1; i++) {
        args.push(arguments[i]);

    }
    if (arguments.length > 2) {
        var arr = arguments[arguments.length - 1];
        for (var i = 0; i < arr.length; i++) {
            args.push(arr[i]);
        }
    }
    return func.apply(obj, args);
};

/**
 * @param {function(...)} func
 * @param {?} key
 * @param {?} data
 */
recoil.util.func.makeEqualFunc = function(func, key, data) {
    func.$key = {key: key, data: data};

    func.equals = function(that) {
        return that && recoil.util.object.isEqual(that.$key, func.$key);
    };

};
