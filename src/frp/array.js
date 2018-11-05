goog.provide('recoil.frp.Array');

goog.require('recoil.frp.Util');
goog.require('recoil.util.object');



/**
 * @constructor
 * @param {!recoil.frp.Frp} frp
 */
recoil.frp.Array = function(frp) {
    this.frp_ = frp;
    this.util_ = new recoil.frp.Util(frp);
};

/**
 * @param {!Array<?>|recoil.frp.Behaviour<!Array<?>>} array
 * @return {!recoil.frp.Behaviour<boolean>}
 */
recoil.frp.Array.prototype.isEmpty = function(array) {
    return this.frp_.liftB(function(arr) {
        return arr.length === 0;
    }, this.util_.toBehaviour(array));
};

/**
 * @param {!Array<?>|!recoil.frp.Behaviour<!Array<?>>} array1
 * @param {!Array<?>|!recoil.frp.Behaviour<!Array<?>>} array2
 * @return {!recoil.frp.Behaviour<!Array<?>>}
 */
recoil.frp.Array.prototype.append = function(array1, array2) {
    return this.frp_.liftB(function(arr1, arr2) {
        return arr1.concat(arr2);
    }, this.util_.toBehaviour(array1), this.util_.toBehaviour(array2));
};


/**
 * @param {Array<?>|recoil.frp.Behaviour<Array>|recoil.frp.Behaviour<!Array>} array
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.Array.prototype.isNotEmpty = function(array) {
    return this.frp_.liftB(function(arr) {
        return arr.length > 0;
    }, this.util_.toBehaviour(array));
};


/**
 * @template FROM
 * @template TO
 * @param {!IArrayLike<FROM>|!Array<FROM>|!recoil.frp.Behaviour<!IArrayLike<FROM>>|!recoil.frp.Behaviour<!Array<FROM>>} array
 * @param {(!function(FROM) : TO|!recoil.frp.Behaviour<!function(FROM) : TO>)} map
 * @param {(!function(TO) : FROM|!recoil.frp.Behaviour<!function(TO) : FROM>)=} opt_inv
 * @return {!recoil.frp.Behaviour<!Array<TO>>}
 */
recoil.frp.Array.prototype.map = function(array, map, opt_inv) {
    var mapFunc = function(arr, map) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            res.push(map(arr[i]));
        }
        return res;
    };
    if (opt_inv) {
        var invFunc = function(arr, arrayB, mapB, invB) {
            var res = [];
            var inv = invB.get();
            for (var i = 0; i < arr.length; i++) {
                res.push(inv(arr[i]));
            }
            arrayB.set(res);

        };
        return this.frp_.liftBI(mapFunc, invFunc, this.util_.toBehaviour(array), this.util_.toBehaviour(map), this.util_.toBehaviour(opt_inv));
    }
    else {
        return this.frp_.liftB(mapFunc, this.util_.toBehaviour(array), this.util_.toBehaviour(map));
    }
};


/**
 * @template T
 * @param {!IArrayLike<T>|!recoil.frp.Behaviour<!IArrayLike<T>>|!Array<T>|!recoil.frp.Behaviour<!Array<T>>} array
 * @param {(!function(T) : boolean|!recoil.frp.Behaviour<!function(T) : boolean>)} filter
 * @param {!boolean=} opt_inversable if true then you can set the list, not the new filtered items will be at the end of the list
 * @return {!recoil.frp.Behaviour<!Array<T>>}
 */
recoil.frp.Array.prototype.filter = function(array, filter, opt_inversable) {
    return this.frp_.liftBI(
        function(arr, filter) {
            var res = [];
            for (var i = 0; i < arr.length; i++) {
                if (filter(arr[i])) {
                    res.push(arr[i]);
                }
            }
            return res;
        },
        function(arr, arrayB, filterB) {
            if (opt_inversable) {
                var src = arrayB.get();
                var filter = filterB.get();

                if (!src) {
                    return;
                }
                var res = [];
                for (var j = 0; j < src.length; j++) {
                    if (!filter(src[j])) {
                        res.push(src[j]);
                    }
                }

                for (var i = 0; i < arr.length; i++) {
                    res.push(arr[i]);
                }
                arrayB.set(res);
            }
        },
        this.util_.toBehaviour(array), this.util_.toBehaviour(filter));
};


/**
 * @template T
 * @param {!IArrayLike<T>|!Array<T>|!recoil.frp.Behaviour<!IArrayLike<T>>|!recoil.frp.Behaviour<!Array<T>>} array
 * @param {!string} tag
 * @return {!recoil.frp.Behaviour<!Array<T>>}
 */
recoil.frp.Array.prototype.tag = function(array, tag) {
    var filter = function(v) {
        return v.tag === tag;
    };
    var stripTag = function(v) {
        return v.value;
    };
    var tagger = function(v) {
        return {tag: tag, value: v};
    };

    return this.map(this.filter(array, filter, true), stripTag, tagger);
};


/**
 * @template T
 * @param {!IArrayLike<{tag:!string,value:T}>|!Array<!{tag:string,value:T}>|!recoil.frp.Behaviour<!IArrayLike<{tag:!string,value:T}>>|!Array<{tag:!string,value:T}>} array
 * @param {!string} tag
 * @return {!recoil.frp.Behaviour<!Array<T>>}
 */
recoil.frp.Array.prototype.stripTag = function(array, tag) {

    var stripTag = function(v) {
        if (v && v.tag) {

            return v.value;
        }
        return v;
    };

    return this.map(array, stripTag);
};


/**
 * makes a map from the key -> value column
 * @param {!recoil.frp.Behaviour<!Array<Object>>} arrB
 * @param {string} key
 * @return {!recoil.frp.Behaviour<!Object<string,?>>}
 */

recoil.frp.Array.prototype.toMap = function(arrB, key) {
    return this.frp_.liftB(function(t) {
        var res = {};
        t.forEach(function(row) {
            res[row[key]] = row;
        });
        return res;
    }, arrB);
};


/**
 * makes a map from the key -> value column
 * @template T
 * @param {!recoil.frp.Behaviour<!Array<T>>} allB
 * @param {!recoil.frp.Behaviour<!Object>} usedB
 * @param {function(?):string} keyGetter
 * @return {!recoil.frp.Behaviour<!Array<T>>}
 */

recoil.frp.Array.prototype.unused = function(allB,  usedB, keyGetter) {
    return this.frp_.liftB(function(t, used) {
        var res = [];
        t.forEach(function(item) {
            if (!used[keyGetter(item)]) {
                res.push(item);
            }
        });
        return res;
    }, allB, usedB);
};
