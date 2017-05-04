goog.provide('recoil.util.object');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.structs.AvlTree');
goog.require('recoil.util.Sequence');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
recoil.util.object.safeFreeze = function(value) {

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
 * a generic compare function that should handle anything
 *
 * @param {*} a
 * @param {*} b
 * @return {!number}
 */
recoil.util.object.compare = function(a, b) {
    return recoil.util.object.compare_(a, b, [], []);
};

/**
 * calls compare on all arguments, returns the first non-zero result
 *
 * @param {!Array<!{x:*,y:*}>} values
 * @return {!number}
 */
recoil.util.object.compareAll = function(values) {
    for (var i = 0; i < values.length; i++) {
        var res = recoil.util.object.compare(values[i].x, values[i].y);
        if (res !== 0) {
            return res;
        }
    }
    return 0;
};


/**
 * a generic compare function that compares only the key
 * field in the object
 *
 * @param {!{key}} a
 * @param {!{key}} b
 * @return {!number}
 */
recoil.util.object.compareKey = function(a, b) {
    return recoil.util.object.compare(a.key, b.key);
};


/**
 * a unique object that cloning or equal ensures
 * @private
 * @constructor
 */
recoil.util.object.UniqObject_ = function() {
    this.id_ = recoil.util.object.UniqObject_.seq_.next();
};

/**
 * @return {!Object}
 */
recoil.util.object.UniqObject_.prototype.clone = function() {
    return this;
};

/**
 * @param {*} that
 * @return {!boolean}
 */
recoil.util.object.UniqObject_.prototype.equal = function(that) {
    return this === that;
};

/**
 * @private
 */
recoil.util.object.UniqObject_.seq_ = new recoil.util.Sequence();

/**
 * @return {!Object} returns an object that is uniq, that is can't be cloned, equal will fail if not identical pointer
 */
recoil.util.object.uniq = function() {
    return new recoil.util.object.UniqObject_();
};
/**
 *
 * @param {*} a
 * @param {*} b
 * @param {Array<Object>} aPath
 * @param {Array<Object>} bPath
 * @return {number}
 * @private
 */
recoil.util.object.compare_ = function(a, b, aPath, bPath) {

    // check for loops

    var aIndex = goog.array.indexOf(aPath, a);
    var bIndex = goog.array.indexOf(bPath, b);

    if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === bIndex) {
            return 0;
        }
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        return aIndex === -1 ? 1 : -1;
    }

    if (a === b) {
        return 0;
    }

    if (a === undefined) {
        return -1;
    }

    if (b === undefined) {
        return 1;
    }
    if (a === null) {
        return -1;
    }

    if (b === null) {
        return 1;
    }
    if (a.compare !== undefined && a.compare instanceof Function) {
        return a.compare(b);
    }
    if (b.compare !== undefined && b.compare instanceof Function) {
        return -b.compare(a);
    }

    // if 1 and only 1 of a and b is an array
    if ((a instanceof Array) != (b instanceof Array)) {
        if (goog.isArrayLike(a)) {
            return 1;
        }
        return -1;
    }

    var newAPath = goog.array.concat(aPath, [a]);
    var newBPath = goog.array.concat(bPath, [b]);

    if (a instanceof Array) {

        return goog.array.compare3(/** @type {!IArrayLike} */
            (a), /** @type {!IArrayLike} */
            (b), function(a, b) {
                return recoil.util.object.compare_(a, b, newAPath, newBPath);
            });
    }

    if (a instanceof Object && b instanceof Object) {
        var aKeys = [];
        var bKeys = [];
        for (var k in a) {
            if (a.hasOwnProperty(k)) {
                aKeys.push(k);
            }
        }
        for (var k in b) {
            if (b.hasOwnProperty(k)) {
                bKeys.push(k);
            }
        }
        goog.array.sort(aKeys);
        goog.array.sort(bKeys);

        var res = goog.array.compare3(aKeys, bKeys);
        if (res !== 0) {
            return res;
        }
        for (var i = 0; i < aKeys.length; i++) {
            var k = aKeys[i];
            res = recoil.util.object.compare_(a[k], b[k], newAPath, newBPath);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    }
    if (a instanceof Object) {
        return -1;
    }
    if (b instanceof Object) {
        return 1;
    }
    if (typeof(a) === typeof(b)) {
        return goog.array.defaultCompare(a, b);
    }

    return goog.array.defaultCompare(typeof(a), typeof(b));
};

/**
 * compares 2 objects
 *
 * @param {?} a
 * @param {?} b
 * @param {Object=} opt_ignore a map of fields to ignore
 * @return {!boolean}
 */
recoil.util.object.isEqual = function(a, b, opt_ignore) {

    return recoil.util.object.isEqual.isEqualRec_(a, b, [], [], [], opt_ignore || {});
};

/**
 * compares 2 objects
 *
 * @param {?} obj
 * @param {!Array<?>} opt_path
 * @return {!string}
 */
recoil.util.object.toString = function(obj, opt_path) {
    var func1 = {}.toString;
    var func2 = [].toString;

    var toStringRec = function(o, path) {
        var index = goog.array.indexOf(path, o);
        if (index !== -1) {
            return '<loop{' + index + '}>';
        }
        if (o.toString !== undefined && o.toString !== func1 && o.toString !== func2 && o.toString instanceof Function) {
            return o.toString(path);
        }
        if (o instanceof Array) {
            var ares = [];
            path.push(o);
            for (var i = 0; i < o.length; i++) {
                ares.push(toStringRec(o[i], path));
            }
            path.pop();
            return '[' + ares.join(',') + ']';
        }
        if (o instanceof Object) {
            var ores = [];
            path.push(o);
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    ores.push(k + ':' + toStringRec(o[k], path));
                }
            }

            path.pop(o);
            return '{' + ores.join(',') + '}';
        }
        return '' + o;
    };

    return toStringRec(obj, opt_path || []);
};


/**
 * finds an element, if it does not exist inserts it into
 * the AvlTree and returns it
 * @param {T} val
 * @return {T}
 */
goog.structs.AvlTree.prototype.safeFind = function(val) {
    var res = this.findFirst(val);
    if (res === null) {
        this.add(val);
        return val;
    }
    return res;
};
/**
 * @param {?} other
 * @return {!boolean}
 */
goog.structs.AvlTree.prototype.equals = function(other) {
    if (other instanceof goog.structs.AvlTree) {
        var count = other.getCount();
        if (this.getCount() != count) {
            return false;
        }

        var myRows = [];
        var otherRows = [];
        this.inOrderTraverse(function(row) {
            myRows.push(row);
        });

        other.inOrderTraverse(function(row) {
            otherRows.push(row);
        });
        return recoil.util.object.isEqual(myRows, otherRows);
    }
    return false;
};

/**
 * @param {!Array<!Object>=} opt_path
 * @param {!Array<!Object>=} opt_clonedPath
 * @return {!goog.structs.AvlTree}
 */
goog.structs.AvlTree.prototype.clone = function(opt_path, opt_clonedPath) {
    var clone = new goog.structs.AvlTree(this.comparator_);
    this.inOrderTraverse(function(el) {
        clone.add(recoil.util.object.clone(el, opt_path, opt_clonedPath));
    });
    return clone;
};

/**
 * @private
 * @param {*} a
 * @param {*} b
 * @param {!Array<Object>} aPath
 * @param {!Array<Object>} bPath
 * @param {!Array<!string>} debugPath
 * @param {!Object} ignore
 * @return {!boolean}
 */
recoil.util.object.isEqual.isEqualRec_ = function(a, b, aPath, bPath, debugPath, ignore) {

    // check for loops

    var aIndex = goog.array.indexOf(aPath, a);
    var bIndex = goog.array.indexOf(bPath, b);

    if (aIndex !== -1 || bIndex !== -1) {
        return recoil.util.object.isEqualDebug_(aIndex === bIndex, debugPath);
    }

    if (a === b) {
        return true;
    }

    if (a === undefined || b === undefined || a === null || b === null) {
        return recoil.util.object.isEqualDebug_(false, debugPath);
    }

    if (a.equals !== undefined && a.equals instanceof Function) {
        return recoil.util.object.isEqualDebug_(a.equals(b), debugPath);
    }
    if (b.equals !== undefined && b.equals instanceof Function) {
        return recoil.util.object.isEqualDebug_(b.equals(a), debugPath);
    }

    if (a instanceof Function || b instanceof Function) {
        return recoil.util.object.isEqualDebug_(false, debugPath);
    }
    if ((a instanceof Array) != (b instanceof Array)) {

        return recoil.util.object.isEqualDebug_(false, debugPath);
    }

    var newAPath = goog.array.concat(aPath, [a]);
    var newBPath = goog.array.concat(bPath, [b]);


    if (a instanceof Array) {
        var idx = 0;

        return recoil.util.object.isEqualDebug_(goog.array.equals(/** @type {IArrayLike} */
            (a), /** @type {IArrayLike} */
            (b), function(a, b) {
                var newDebugPath = goog.array.concat(debugPath, '[' + idx + ']');

                return recoil.util.object.isEqual.isEqualRec_(
                    a, b, newAPath, newBPath, newDebugPath, ignore);
            }), debugPath);
    }

    if (a instanceof Object || b instanceof Object) {
        if (!(a instanceof Object) || !(b instanceof Object)) {
            return recoil.util.object.isEqualDebug_(false, debugPath);
        }

        for (var k in a) {
            if (ignore[k]) {
                continue;
            }
            var newDebugPath = goog.array.concat(debugPath, k);
            if (!(k in b) || !recoil.util.object.isEqual.isEqualRec_(a[k], b[k], newAPath, newBPath, newDebugPath, ignore)) {
                return recoil.util.object.isEqualDebug_(false, newDebugPath);
            }
        }
        for (k in b) {
            if (ignore[k]) {
                continue;
            }
            if (!(k in a)) {
                newDebugPath = goog.array.concat(debugPath, k);
                return recoil.util.object.isEqualDebug_(false, newDebugPath);
            }
        }
        return true;
    }
    recoil.util.object.isEqualDebug_(false, debugPath);
    return false;
};

/**
 * turn this on to debug equal failing
 * @private
 * @param {!boolean} val
 * @param {!Array<string>} path
 * @return {!boolean}
 */
recoil.util.object.isEqualDebug_ = function(val, path) {
/*    if (!val) {
        console.log('Not Equal', path);
    }*/
    return val;
};

/**
 * @param {!Object} source
 * @param {...!Object} var_args
 */
recoil.util.object.addProps = function(source, var_args) {
    var src = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
        for (var prop in arguments[i]) {
            if (arguments[i].hasOwnProperty(prop)) {
                src[prop] = arguments[i][prop];
            }
        }
    }
};
/**
 * @param {Object} obj
 * @return {Object}
 */

recoil.util.object.removeUndefined = function(obj) {
    for (var k in obj) {
        if (obj[k] === undefined) {
            delete obj[k];
        }
    }
    return obj;
};

/**
 * @param {Object} obj
 * @param {...string} var_parts
 * @return {*}
 */

recoil.util.object.getByParts = function(obj, var_parts) {
    var cur = obj;
    for (var i = 1; i < arguments.length; i++) {
        if (!(cur instanceof Object)) {
            return undefined;
        }
        cur = cur[arguments[i]];
    }
    return cur;
};

/**
 * best effort at deep clone, it handles loops, it handles instanceof
 * I don't think it handles cloning parent scope
 *
 * if there is a clone method on it it will call that instead
 * @template T
 * @param {T} obj the object to clone
 * @param {!Array<!Object>=} opt_path
 * @param {!Array<!Object>=} opt_clonedPath
 * @return {T}
 */
recoil.util.object.clone = function(obj, opt_path, opt_clonedPath) {
    return recoil.util.object.clone.cloneRec_(obj, opt_path || [], opt_clonedPath || []);
};
/**
 * @template T
 * @private
 * @param {T} obj the object to clone
 * @param {!Array<!Object>} path
 * @param {!Array<!Object>} clonedPath
 * @return {T}
 */
recoil.util.object.clone.cloneRec_ = function(obj, path, clonedPath) {

    var type = goog.typeOf(obj);
    if (type == 'object' || type == 'array') {
        var idx = goog.array.indexOf(path, obj);

        if (idx !== -1) {
            return clonedPath[idx];
        }

        if (goog.isFunction(obj.clone)) {
            return obj.clone(path, clonedPath);
        }

        var clone = type == 'array' ? [] : Object.create(Object.getPrototypeOf(obj));
        var newPath = goog.array.clone(path);
        var newClonedPath = goog.array.clone(clonedPath);
        newPath.push(obj);
        newClonedPath.push(clone);


        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = recoil.util.object.clone.cloneRec_(obj[key], newPath, newClonedPath);
            }
        }

        return clone;
    }

    return obj;
};

/**
 * make an object a constant, this means clone and equal only compare pointers
 * @template T
 * @param {!T} obj
 * @return {!T}
 */
recoil.util.object.constant = function(obj) {
    obj.clone = function() {
        return obj;
    };
    obj.equals = function(that) {
        return obj === that;
    };

    return obj;
};
