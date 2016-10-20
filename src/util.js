goog.provide('recoil.util');
goog.provide('recoil.util.Handle');
goog.provide('recoil.util.Sequence');
goog.provide('recoil.util.object');
goog.provide('recoil.util.map');

goog.require('goog.array');
goog.require('goog.math.Long');
goog.require('goog.object');
goog.require('goog.structs.AvlTree');
/**
 * a class to create a incrementing sequence
 * of strings
 * @constructor
 */
recoil.util.Sequence = function() {
    this.val_ = goog.math.Long.getOne();
};
/**
 * get the next value and increment the counter
 * @return {string}
 */
recoil.util.Sequence.prototype.next = function() {
    var res = new String(this.val_);
    this.val_ = this.val_.add(goog.math.Long.getOne());
    return res.toString();
};

/**
 * get the next value and increment the counter
 * @return {goog.math.Long}
 */
recoil.util.Sequence.prototype.nextLong = function() {
    var res = this.val_;
    this.val_ = this.val_.add(goog.math.Long.getOne());
    return res;
};

/**
 * @template T
 * @param {T} value
 * @return {T}
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
 * @template T
 * @template F
 * @param {Object} me
 * @param {F} func
 * @param {*} arg1
 * @param {Array<*>} rest
 * @return {T}
 */
recoil.util.invokeOneParamAndArray = function(me, func, arg1, rest) {
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
recoil.util.invokeParamsAndArray = function(func, obj, var_arguments) {
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
 * a generic compare function that should handle anything
 *
 * @param {*} a
 * @param {*} b
 * @return {!number}
 */
recoil.util.compare = function(a, b) {
    return recoil.util.compare_(a, b, [], []);
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
recoil.util.compare_ = function(a, b, aPath, bPath) {

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
    if (goog.isArrayLike(a) != goog.isArrayLike(b)) {
        if (goog.isArrayLike(a)) {
            return 1;
        }
        return -1;
    }

    var newAPath = goog.array.concat(aPath, [a]);
    var newBPath = goog.array.concat(bPath, [b]);

    if (goog.isArrayLike(a)) {

        return goog.array.compare3(/** @type {!IArrayLike} */
            (a), /** @type {!IArrayLike} */
            (b), function(a, b) {
                return recoil.util.compare_(a, b, newAPath, newBPath);
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
            res = recoil.util.compare_(a[k], b[k], newAPath, newBPath);
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

    return goog.array.defaultCompare(a, b);
};

/**
 * compares 2 objects
 *
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @return {!boolean}
 */
recoil.util.isEqual = function(a, b) {

    return recoil.util.isEqual.isEqualRec_(a, b, [], [], []);
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
        return recoil.util.isEqual(myRows, otherRows);
    }
    return false;
};


/**
 * @private
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @param {!Array<Object>} aPath
 * @param {!Array<Object>} bPath
 * @param {!Array<!string>} debugPath
 * @return {!boolean}
 */
recoil.util.isEqual.isEqualRec_ = function(a, b, aPath, bPath, debugPath) {

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
        return recoil.util.isEqualDebug_(false, debugPath);
    }

    if (a.equals !== undefined && a.equals instanceof Function) {
        return a.equals(b);
    }
    if (b.equals !== undefined && b.equals instanceof Function) {
        return recoil.util.isEqualDebug_(b.equals(a), debugPath);
    }

    if (goog.isArrayLike(a) != goog.isArrayLike(b)) {

        return recoil.util.isEqualDebug_(false, debugPath);
    }

    var newAPath = goog.array.concat(aPath, [a]);
    var newBPath = goog.array.concat(bPath, [b]);


    if (goog.isArrayLike(a)) {
        var idx = 0;

        return goog.array.equals(/** @type {IArrayLike} */
            (a), /** @type {IArrayLike} */
            (b), function(a, b) {
                var newDebugPath = goog.array.concat(debugPath, '[' + idx + ']');

                return recoil.util.isEqual.isEqualRec_(
                    a, b, newAPath, newBPath, newDebugPath);
            });
    }

    if (a instanceof Object || b instanceof Object) {
        if (!(a instanceof Object) || !(b instanceof Object)) {
            return recoil.util.isEqualDebug_(false, debugPath);
        }

        for (var k in a) {
            var newDebugPath = goog.array.concat(debugPath, k);
            if (!(k in b) || !recoil.util.isEqual.isEqualRec_(a[k], b[k], newAPath, newBPath, newDebugPath)) {
                return false;
            }
        }
        for (var k in b) {
            if (!(k in a)) {
                newDebugPath = goog.array.concat(debugPath, k);
                return recoil.util.isEqualDebug_(false, newDebugPath);
            }
        }
        return true;
    }
    recoil.util.isEqualDebug_(false, debugPath);
    return false;
};

/**
 * turn this on to debug equal failing
 * @private
 * @param {!boolean} val
 * @param {!Array<string>} path
 * @return {!boolean}
 */
recoil.util.isEqualDebug_ = function(val, path) {
//    if (!val) {
//        console.log('Not Equal', path);
//    }
    return val;
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
recoil.util.Handle.prototype.set = function(value) {
    this.value_ = value;
};

/**
 * @return {T}
 */
recoil.util.Handle.prototype.get = function() {
    return this.value_;
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
 * gets an item out of a map, if the item
 * does not exist it will insert the default into the map
 * and return that
 * @template T
 * @param {Object} map
 * @param {?} key
 * @param {T} def
 * @return {T}
 */

recoil.util.map.safeGet = function (map, key, def) {
    var res = map[key];
    if (!res) {
        res = def;
        map[key] = def;
    }
    return res;
};
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

recoil.util.Options = function(var_options) {
    var res = {};
    var remaining = {};
    var mkSetFunc =  function (struct, remaining, name) {
        struct = goog.object.clone(struct);
        remaining = goog.object.clone(remaining);

      return function (val) {
          delete remaining[name];

          if(arguments.length > 1){
              for(var n in name){
                  for(var i = 0; i < name[n].length; i++){
                      struct[n + "_" + name[n][i]] = arguments[i];
                  }
              }
          } else {
              struct[name] = val;
          }

          var res1 = {};
          for (var name1 in remaining) {
              res1[name1] = mkSetFunc(struct, remaining, name1);
          }
          res1.struct = function () {
              return struct;
          };
          res1.attach = function (widget) {
              widget.attachStruct(struct);
          };
          return res1;
      }
     };

    for (var i = 0; i < arguments.length; i++) {
        var name = arguments[i];
        if (name instanceof Object) {
            for(var v in name) {
                    remaining[v] = true;
            }
        } else {
            remaining[name] = true;
        }
    }

    for (var i = 0; i < arguments.length; i++) {
         var name = arguments[i];

        if(name instanceof Object){
            res[v] = mkSetFunc({}, remaining, name);

        } else {
            res[name] = mkSetFunc({}, remaining, name);
        }
    }

    res.struct = function () {
        return {};
    };
    res.attach = function (widget) {
        widget.attachStruct({});
    };
    return res;
};