goog.provide('recoil.util');

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
