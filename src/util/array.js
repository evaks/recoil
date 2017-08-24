goog.provide('recoil.util.array');

goog.require('recoil.util.object');

/**
 * @param {!Array} arr
 * @param {?} val
 * @param {function(?,?):!number=} opt_equalsFn
 * @return {!number}
 */
recoil.util.array.indexOf = function (arr, val, opt_equalsFn) {
    var eq = opt_equalsFn || recoil.util.object.isEqual;
    
    for (var i = 0; i < arr.length; i++) {
        if (eq(arr[i], val)) {
            return i;
        }
    }
    return -1;
}