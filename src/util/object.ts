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
 * @param {?} a
 * @param {?} b
 * @return {number}
 */
recoil.util.object.compare = function(a, b) {
    return recoil.util.object.compare_(a, b, [], []);
};

/**
 * calls compare on all arguments, returns the first non-zero result
 *
 * @param {!Array<{x:*,y:*}>} values
 * @return {number}
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
 * @param {{key}} a
 * @param {{key}} b
 * @return {number}
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
 * @return {boolean}
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
 * @param {Array} aPath
 * @param {Array} bPath
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second,
 *     respectively.
 * @private
 */
recoil.util.object.compare_ = function(a, b, aPath, bPath) {

    // check for loops

    const aIndex = aPath.indexOf(a);
    const bIndex = bPath.indexOf(b);

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

    var res;
    if (a.compare !== undefined && a.compare instanceof Function) {
        res = a.compare(b);
        if (res !== undefined) {
            return res;
        }
    }
    if (b.compare !== undefined && b.compare instanceof Function) {
        res = b.compare(a);
        if (res !== undefined) {
            return -res;
        }
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

        res = goog.array.compare3(aKeys, bKeys);
        if (res !== 0) {
            return res;
        }
        var skiped = false;
        for (var i = 0; i < aKeys.length; i++) {
            var k = aKeys[i];
            res = recoil.util.object.compare_(a[k], b[k], newAPath, newBPath);
            if (res === undefined) {
                skiped = true;
                continue;
            }
            if (res !== 0) {
                return res;
            }
        }
        return skiped ? undefined : 0;
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
 * @return {boolean}
 */
export function isEqual(a:any, b:any, opt_ignore:Set) {
    return isEqualRec(a, b, [], [], [], opt_ignore || {});
};


/**
 * compares 2 objects
 *
 * @param {?} obj
 * @param {!Array<?>=} opt_path
 * @return {string}
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
            try {
                return o.toString(path);
            }
            catch (e) {
                return '' + o;
            }
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
 * @param {?} other
 * @return {boolean}
 */
Date.prototype.equals = function(other) {

    if (other instanceof Date) {
        return this.getTime() === other.getTime();
    }
    return false;
};

/**
 * @param {?} other
 * @return {number}
 */
Date.prototype.compare = function(other) {

    if (other instanceof Date) {
        return this.getTime() - other.getTime();
    }
    return -1;
};

/**
 * @param {?} other
 * @return {boolean}
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
 * @param {?} other
 * @return {number}
 */
goog.structs.AvlTree.prototype.compare = function(other) {
    if (other instanceof goog.structs.AvlTree) {
        var count = other.getCount();
        if (this.getCount() != count) {
            return this.getCount() - count;
        }

        var myRows = [];
        var otherRows = [];
        this.inOrderTraverse(function(row) {
            myRows.push(row);
        });

        other.inOrderTraverse(function(row) {
            otherRows.push(row);
        });
        return recoil.util.object.compare(myRows, otherRows);
    }
    return -1;
};

/**
 * @param {!WeakMap=} opt_used
 * @return {!goog.structs.AvlTree}
 * @suppress {visibility}
 */
goog.structs.AvlTree.prototype.clone = function(opt_used) {
    opt_used = opt_used || new WeakMap();
    var me = opt_used.get(this);
    if (me) {
        return me;
    }
    var clone = new goog.structs.AvlTree(this.comparator_);
    opt_used.set(this, clone);
    this.inOrderTraverse(function(el) {
        clone.add(recoil.util.object.clone(el, opt_used));
    });
    return clone;
};

/**
 * use this for equals utility if you are a container, it will stop loops
 * @param {*} a
 * @param {*} b
 * @param {!Array<Object>} aPath
 * @param {!Array<Object>} bPath
 * @param {!Array<string>} debugPath
 * @param {!Object} ignore
 * @return {boolean}
 */
recoil.util.object.isContainerEqual = function(a, b, aPath, bPath, debugPath, ignore) {
    return recoil.util.object.isEqual.isEqualRec_(a, b, aPath, bPath, debugPath, ignore);
};

function setIndexOf(val: any, aSet:Set<Object>)  {
		let i = -1;
		
		for (let v of aSet) {
				i++;
				if (v === val) {
						return i;
				}
		}
		return -1;
}

function mapEquals(a:Map, b:Map, aPath:Set<Object>, bPath:Set<Object>, debugPath:[any], ignore:Set):boolean {
		if (a.size != b.size) {
				return isEqualDebug(false, debugPath);
		}

		let newAPath:Set<Object> = new Set(aPath);
		let newBPath:Set<Object> = new Set(bPath);

		newAPath.add(a);
		newBPath.add(b);
		
		for (const [key, aValue] of a) {
				// I think we don't need to do anything special with key because
				// we define the lookup as same value zero equality otherwize we couldn't use a map
				
				if (!b.has(key)) {
						let newDebugPath = [...debugPath];
						newDebugPath.push(k);
						return isEqualDebug(false, debugPath);
				}
				let bValue = b.get(a);
				let newDebugPath = [...debugPath];
				newDebugPath.push(k);
				if (!isEqualRec(aValue, bValue, newAPath, newBPath, newDebugPath, ignore)) {
						return false;
				}
		}
		return isEqualDebug(true, debugPath);
		
}

function setEquals(a:Map, b:Map, aPath:Set<Object>, bPath:Set<Object>, debugPath:[any], ignore:Set):boolean {
		if (a.size != b.size) {
				return isEqualDebug(false, debugPath);
		}

		let newAPath:Set<Object> = new Set(aPath);
		let newBPath:Set<Object> = new Set(bPath);

		newAPath.add(a);
		newBPath.add(b);
		
		for (const key of a) {
				// I think we don't need to do anything special with key because
				// we define the lookup as same value zero equality otherwize we couldn't use a set
				if (!b.has(key)) {
						let newDebugPath = [...debugPath];
						newDebugPath.push(k);
						return isEqualDebug(false, debugPath);
				}
		}
		return isEqualDebug(true, debugPath);
		
}


function isEqualRec(a: any, b: any, aPath:Set<Object>, bPath:Set<Object>, debugPath:[any], ignore: Set) {
		// check for loops
		const aLoop = aPath.has(a);
    const bLoop = bPath.has(b);

		if (aLoop != bLoop) {
				return isEqualDebug(false, debugPath);
		}

		if (aLoop) {
				return isEqualDebug(setIndexOf(a, aPath) == setIndexOf(b, bPath), debugPath);
		}

		if (a === b) {
				return true;
		}

		if (a === undefined || b === undefined || a === null || b === null) {
				return isEqualDebug(false, debugPath);
    }

		if (a.equals instanceof Function) {
        return isEqualDebug(a.equals(b), debugPath);
    }

		if (b.equals instanceof Function) {
        return isEqualDebug_(b.equals(a), debugPath);
    }


		if (a instanceof Map) {
				if (b instanceof Map) {
						return mapEquals(a, b, aPath, bPath, debugPath, ignore);
				}
				return isEqualDebug(false, debugPath);
		}

		if (a instanceof Set) {
				if (b instanceof Set) {
						return setEquals(a, b, aPath, bPath, debugPath, ignore)
				}
				return isEqualDebug(false, debugPath);
		}

		if (typeof (a) == 'number' && typeof(b) == 'number') {
				return (isNaN(a) && isNaN(b)) || a === b;
    }

		if (a instanceof Array) {
				if (b instanceof Array) {
						let newAPath:Set<Object> = new Set(aPath);
						let newBPath:Set<Object> = new Set(bPath);
						
						newAPath.add(a);
						newBPath.add(b);

						if (a.length !== b.length) {
								return isEqualDebug(false, debugPath);
						}
						for (let i = 0; i < a.length; i++) {
								if (!isEqualRec_(
										a[i], b[i], newAPath, newBPath, [...debugPath, '[' + idx + ']'], ignore)) {
										return isEqualDebug_(false, newDebugPath);
								}
						}
						return true;
				}
		}

		if (a instanceof Object) {
				if (b instanceof Object) {
						let newAPath:Set<Object> = new Set(aPath);
						let newBPath:Set<Object> = new Set(bPath);
						
						newAPath.add(a);
						newBPath.add(b);
						
						for (let k in a) {
								if (ignore[k]) {
										continue;
								}
								if (!(k in b) || !isEqualRec(a[k], b[k], newAPath, newBPath, [...debugPath, k], ignore)) {
										return recoil.util.object.isEqualDebug_(false, newDebugPath);
								}
						}
						
						for (let k in b) {
								if (ignore[k]) {
										continue;
								}
								if (!(k in a)) {
										return isEqualDebug_(false, [...debugPath, k]);
								}
						}
						return true;
				}
		}
		return isEqualDebug(false, debugPath);
}

/**
 * turn this on to debug equal failing
 * @private
 * @param {boolean} val
 * @param {!Array<string>} path
 * @return {boolean}
 */
function isEqualDebug = function(val, path) {
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
 * @param {!WeakMap=} opt_used
 * @return {T}
 */
recoil.util.object.clone = function(obj, opt_used) {
    return recoil.util.object.clone.cloneRec_(obj, opt_used || new WeakMap());
};
/**
 * @template T
 * @private
 * @param {T} obj the object to clone
 * @param {!WeakMap} used
 * @return {T}
 */
recoil.util.object.clone.cloneRec_ = function(obj, used) {

    var type = goog.typeOf(obj);
    if (type == 'object' || type == 'array') {
        var me = used.get(obj);
        if (me) {
            return me;
        }
        if (goog.isFunction(obj.clone)) {
            return obj.clone(used);
        }

        var clone = type == 'array' ? [] : Object.create(Object.getPrototypeOf(obj));

        used.set(obj, clone);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = recoil.util.object.clone.cloneRec_(obj[key], used);
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
