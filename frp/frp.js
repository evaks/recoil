goog.provide('recoil.frp');
goog.provide('recoil.frp.BStatus');
goog.provide('recoil.frp.Behaviour');
goog.provide('recoil.frp.Frp');
goog.provide('recoil.frp.IsEqual');
goog.provide('recoil.frp.TransactionManager');

goog.require('goog.array');
goog.require('goog.math.Long');
goog.require('recoil.exception.frp.LoopDetected');
goog.require('recoil.structs.UniquePriorityQueue');

/**
 * recoil.frp.TraverseDirection.
 * 
 * @param {function(recoil.frp.Behaviour,Array
 *                <recoil.frp.Behaviour>)} calc
 * @param {function(recoil.frp.Behaviour,recoil.frp.Behaviour):number}
 *                comparator
 * @constructor
 */

recoil.frp.TraverseDirection = function(calc, comparator) {
    this.calc_ = calc;
    this.comparator_ = comparator;
};

/**
 * 
 * @param {recoil.frp.Behaviour}
 *                behaviour
 * @param {Array
 *                <recoil.frp.Behaviour>} providers
 * 
 */
recoil.frp.TraverseDirection.prototype.calculate = function(behaviour, providers) {
    this.calc_(behaviour);
};
/**
 * 
 * @param {recoil.frp.Behaviour}
 *                a
 * @param {recoil.frp.Behaviour}
 *                b
 * @return {number}
 */

recoil.frp.TraverseDirection.prototype.heapComparator = function(a, b) {
    return this.comparator_(a, b);
};
/**
 * 
 * @param {recoil.frp.TransactionManager}
 *                transactionManager
 * @constructor
 */
recoil.frp.Frp = function(transactionManager) {
    this._transactionManager = transactionManager || new recoil.frp.TransactionManager();
};

/**
 * 
 * provides the status of the behaviour, e.g. is it ready, or an error occured
 * 
 * @param {T=}
 *                opt_initial
 * @constructor
 * @template T
 */
recoil.frp.BStatus = function(opt_initial) {
    this._errors = [];
    this._ready = true;
    this._value = opt_initial || null;
};

/**
 * combine this error and another to get a result
 * 
 * @param {recoil.frp.BStatus}
 *                other
 */
recoil.frp.BStatus.prototype.merge = function(other) {
    this._errors = goog.array.concat(this._errors, other._errors);
    this._ready = this._ready && other._ready;
};

/**
 * set the of the status
 * 
 * @param {recoil.frp.BStatus
 *                <T>} val
 */
recoil.frp.BStatus.prototype.set = function(val) {
    this._value = val;
};

/**
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.BStatus.prototype.get = function() {
    return this._value;
};

/**
 * @private
 * @param {Array
 *                <math.goog.Long>} a
 * @param {Array
 *                <math.goog.Long>} b
 * @return {number}
 */

recoil.frp.Frp.compareSeq_ = function(a, b) {
    var len = a.length > b.length ? b.length : a.length;

    for (var i = 0; i < len; i++) {
        if (a[i] < b[i]) {
            return -1;
        }
        if (a[i] > b[i]) {
            return 1;
        }
    }

    if (a.length > b.length) {
        return -1;
    }
    if (a.length < b.length) {
        return 1;
    }
    return 0;
};

/**
 * compares 2 objects
 * 
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @return {boolean}
 */
recoil.frp.isEqual = function(a, b) {

    return recoil.frp.isEqual.isEqualRec_(a, b, [], []);
};

/**
 * @private
 * @param {Object|number|undefined} a
 * @param {Object|number|undefined} b
 * @param {Array<Object>} aPath
 * @param {Array<Object>} bPath
 * @return {boolean}
 */
recoil.frp.isEqual.isEqualRec_ = function(a, b, aPath, bPath) {

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
        
        return goog.array.equals(/** @type {goog.array.ArrayLike} */ (a), b, function(a, b) {
            return recoil.frp.isEqual.isEqualRec_(a, b, newAPath, newBPath);
        });
    }

    if (a instanceof Object || b instanceof Object) {
        if (!(a instanceof Object) || !(b instanceof Object)) {
            return false;
        }

        for ( var k in a) {
            if (!(k in b) || !recoil.frp.isEqual.isEqualRec_(a[k], b[k], newAPath, newBPath)) {
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
 * 
 * @enum {recoil.frp.TraverseDirection}
 * @private
 */

recoil.frp.Frp.Direction_ = {

    UP: new recoil.frp.TraverseDirection(function(behaviour, providers, dependants) {
        var oldVal = behaviour._val;

        var params = [];
        providers.forEach(function(b) {
            params.push(b.get());
        });

        var newVal = behaviour._calc.apply(behaviour, params);

        if (!recoil.frp.isEqual(oldVal, newVal)) {
            behaviour._val = newVal;
            behaviour._dirty = false;
            return dependants;
        }
        behaviour._dirty = false;

        return [];
    }, function(a, b) {
        return recoil.frp.Frp.compareSeq_(a._seq, b._seq);
    }),

    DOWN: new recoil.frp.TraverseDirection(function(behaviour, providers, dependants) {
        function getDirty(dependants) {
            var res = {};
            for (var i = 0; i < dependants.length; i++) {
                if (dependants[i]._dirty) {
                    res[String(res._seq)] = dependants[i];
                }
            }
            return res;
        }

        var changedDirty = [];
        if (behaviour._dirty) {
            var oldDirty = getDirty(behaviour._providers);
            behaviour._inv.call(behaviour, behaviour._val);
            var newDirty = getDirty(behaviour._providers);

            var id;
            for (id in newDirty) {
                if (oldDirty[id] !== undefined) {

                    changedDirty.push(newDirty[id]);
                }

            }
            behaviour._dirty = false;
        }
        return changedDirty;
    }, function(a, b) {
        return recoil.frp.Frp.compareSeq_(b._seq, a._seq);

    })

};

/**
 * 
 * @constructor
 * @template T
 * 
 * @param {recoil.frp.BStatus
 *                <T> | undefined} value
 * @param {function(...) :
 *                T| undefined} calc
 * @param {function(T)|
 *                undefined} inverse
 * @param {Array
 *                <goog.math.Long>} sequence
 * @param {Array
 *                <recoil.frp.Behaviour>?} providers
 */
recoil.frp.Behaviour = function(value, calc, inverse, sequence, providers) {
    var me = this;
    this._val = value;
    this._calc = calc || function() {
        return me._val;
    };
    this._inv = inverse || function(newVal) {
    };
    this._dirty = false;
    this._refs = 0;
    this._seq = sequence;
    this._providers = providers || [];
};

function foo() {

}

/**
 * increases the reference count
 * 
 * @return {boolean} true if count was zero
 * 
 */
recoil.frp.Behaviour.prototype.addRef = function() {
    this._refs++;
    return this._refs === 1;
};

/**
 * decreases the reference count
 * 
 * @return {boolean} true if count goes to zero
 */
recoil.frp.Behaviour.prototype.removeRef = function() {
    this._refs--;
    return this._refs === 0;
};

/**
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.Behaviour.prototype.unsafeMetaGet = function() {
    return this._val;
};

/**
 * @return {T}
 */
recoil.frp.Behaviour.prototype.get = function() {
    return this.metaGet().get();
};

/**
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.Behaviour.prototype.metaGet = function() {
    // TODO check that have all our parameters referenced
    return this._val;
};

/**
 * @template T
 * @param {T}
 *                initial
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createB = function(initial) {
    var metaInitial = new recoil.frp.BStatus(initial);
    return new recoil.frp.Behaviour(metaInitial, undefined, undefined, [this._transactionManager.nextIndex()], []);
};
/**
 * 
 * @template T
 * @param  {recoil.frp.Behaviour<recoil.frp.Behaviour<T>>} Bb
 * @return {T}
 */
recoil.frp.Frp.prototype.switchB = function(Bb) {
    var me = this;
    return this.metaLiftB(function() {
        var switchB = this;
        var metaBb = Bb.metaGet();
        var res = new recoil.frp.BStatus();
        res.merge(metaBb);
        var b = null;

        me._transactionManager.nestIds(Bb, function() {
            if (metaBb._value == null) {
                me._transactionManager.updateProviders_(switchB, Bb);
            } else {
                me._transactionManager.updateProviders_(switchB, Bb, metaBb._value);
                res.merge(metaBb._value);
            }
            b = metaBb._value;
        });

        if (b !== null || b !== undefined) {
            res.set(b.get());
            return res;
        }
        return res;

    }, Bb);
};

/**
 * calls function, arguments and return value should contain meta information
 * 
 * @template T
 * @param {function(...) :
 *                T} func
 * @param {...}
 *                var_args
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.metaLiftB = function(func, var_args) {
    var providers = [];
    for (var i = 1; i < arguments.length; i++) {
        providers.push(arguments[i]);
    }
    return new recoil.frp.Behaviour(undefined, func, undefined, [this._transactionManager.nextIndex()], providers);
};

/**
 * @template RT
 * @param {function(...) :
 *                RT} func
 * @param {...number}
 *                var_args
 * @return {recoil.frp.Behaviour<RT>}
 */
recoil.frp.Frp.prototype.liftB = function(func, var_args) {

    var outerArgs = arguments;

    return this.metaLiftB(function() {
        var args = [];
        var metaResult = new recoil.frp.BStatus();

        for (var i = 1; i < outerArgs.length; i++) {
            var metaArg = outerArgs[i];
            metaResult.merge(metaArg);
            args.push(metaArg.get());
        }
        var result = func.apply(null, args);
        metaResult.set(result);
        return metaResult;
    });

};

/**
 * @constructor
 */
recoil.frp.TransactionManager = function() {
    this._providers = [];
    this._level = 0;
    this._dependancyMap = [];
    this._curIndex = goog.math.Long.ZERO;
    this._curIndexPrefix = [[]];
};

/**
 * this makes all ids generated sub ids of the current one 
 * I think this is wrong really we need it to be children of the behaviour that depends on it
 * TODO
 * @template T
 * @param  {recoil.frp.Behaviour<recoil.frp.Behaviour<T>>} behaviour the parent behaviour all generated sequences will be less than this
 * @param {function()} callback
 */
recoil.frp.TransactionManager.prototype.nestIds = function(behaviour, callback) {
    try {
        this._curIndexPrefix.push(behaviour._seq);
        callback();
    } finally {
        this._curIndexPrefix.pop();
    }
};

/**
 * to a transaction nothing should fire until we exit out the top level
 * 
 * @param {function()} callback
 */

recoil.frp.TransactionManager.prototype.doTrans = function(callback) {
    this._level++;

    try {
        callback();
    } finally {
        this._level--;
    }
};

/**
 * make an array of all providers of behaviour
 * 
 * @template T
 * @param {recoil.frp.Behaviour<recoil.frp.Behaviour<T>>}  behaviour
 * @return {Map<Array<number>, recoil.frp.Behaviour} }
 */
recoil.frp.TransactionManager.prototype.visit = function(behaviour) {
    var toDo = [{
        b: behaviour,
        path: {}
    }];
    var visited = [];

    while (toDo.length > 0) {
        var cur = toDo.pop();

        if (visited[String(cur.b._seq)] !== undefined) {
            continue;
        }
        visited[String(cur.b._seq)] = cur.b;

        for (var prov = 0; prov < cur.b._providers.length; prov++) {
            var provObj = cur.b._providers[prov];
            if (cur.path[String(provObj._seq)] !== undefined) {
                throw new recoil.exception.frp.LoopDetected();
            }

            var newPath = goog.array.clone(cur.path);
            newPath[String(provObj._seq)] = provObj;

            toDo.push({
                b: provObj,
                path: newPath
            });
        }

    }
    return visited;

};

/**
 * generates the next index for behaviours
 * 
 * @return {Array<number>}
 */
recoil.frp.TransactionManager.prototype.nextIndex = function() {
    var res = goog.array.clone(this._curIndexPrefix[this._curIndexPrefix.length - 1]);
    res.push(this._curIndex);
    this._curIndex = this._curIndex.add(goog.math.Long.ONE);
    return res;
};

/**
 * propagate the changes through the FRP tree, the direction is if it is going up or down
 * 
 * @param {Array<recoil.frp.Behaviour>} pending
 * @param {recoil.frp.Direction_} dir
 */
recoil.frp.TransactionManager.prototype.propogate = function(pending, dir) {
    var pendingHeap = new recoil.structs.UniquePriorityQueue(dir.heapComparator);
    // var visited = new Set();

    var i;
    for (i = 0; i < pending.length; i++) {
        pendingHeap.push(pending[i]);
    }

    var cur = pendingHeap.pop();
    while (cur !== undefined) {
        // calculate changed something
        var deps = dir.calculate(cur, cur._providers);
        var d;
        for (d in deps) {
            pendingHeap.push(deps[d]);
        }

        cur = pendingHeap.pop();
    }
};

/**
 * helper function to add the inverse mapping provider to list of dependants
 * @template T
 * @private
 * @param {recoil.frp.Behaviour<T>} b
 */
recoil.frp.TransactionManager.prototype.addProvidersToDependancyMap_ = function(b) {
    var me = this;
    b._providers.forEach(function(prov) {
        var deps = me._dependancyMap[String(prov._seq)];
        if (deps === undefined) {
            deps = [b];
            me._dependancyMap[String(prov._seq)] = deps;
        } else {
            deps.push(b);
        }
    });

};

/**
 * @param {Object}
 *                other
 * @this {Object}
 * @template T
 * @return {boolean} true if objects are equal
 */
recoil.frp.Frp._ptrEqual = function(other) {
    return this === other;
};

/**
 * helper function to remove the inverse mapping provider to list of dependants
 * @template T
 * @private
 * @param {recoil.frp.Behaviour<T>} b
 */
recoil.frp.TransactionManager.prototype.removeProvidersFromDependancyMap_ = function(b) {
    var me = this;
    b._providers.forEach(function(prov) {
        var deps = me._dependancyMap[String(prov._seq)];
        if (deps !== undefined) {
            // TODO what about the same provider twice?
            goog.array.removeIf(deps, recoil.frp.Frp._ptrEqual, prov);
            if (deps.length === 0) {
                delete me._dependancyMap[String(prov._seq)];
            }
        }
    });

};

/**
 * mark the behaviour that it is being used it will now recieve update
 * notifications
 * 
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 */
recoil.frp.TransactionManager.prototype.attach = function(behaviour) {
    var visited = this.visit(behaviour);
    var newStuff = [];
    var me = this;
    for ( var idx in visited) {
        // this may not account for 2 thing in the tree pointing to the
        // same thing
        var b = visited[idx];
        if (b._refs === 0) {
            newStuff.push(visited[idx]);
            me.addProvidersToDependancyMap_(b);
        }
        visited[idx].addRef();
    }
    // TODO change this so does up and down
    this.propogate(newStuff, recoil.frp.Frp.Direction_.UP);
};

/**
 * update the dependaniece of the behaviour
 * @private
 * @param {recoil.frp.Behaviour} dependant
 */
recoil.frp.TransactionManager.prototype.updateProviders_ = function(dependant) {
    var oldVisited = this.visit(dependant);
    var oldProviders = goog.array.clone(dependant._providers);
    dependant._providers = goog.array.clone(arguments);
    // TODO remove the first argument it is the dependant
    var newVisited = this.visit(dependant);

    var me = this;
    for ( var idx in oldVisited) {
        var b = oldVisited[idx];
        var newIdx = goog.array.findIndex(newVisited, recoil.frp.Frp._ptrEqual, b);
        if (newIdx === -1) {
            if (b.removeRef()) {
                me.removeProvidersFromDependancyMap_(b);
            }
        }
    }

    var pending = [];
    for ( var idx in newVisited) {
        var b = newVisited[idx];
        var oldIdx = goog.array.findIndex(oldVisited, recoil.frp.Frp._ptrEqual, b);
        if (oldIdx === -1) {
            if (b.addRef()) {
                me.addProvidersToDependancyMap_(b);
                pending.push(b);
            }
        }
    }

    // if the providers have changed then we need to recalculate the dependant
    // even just the order

    if (oldProviders.length !== dependant._providers.length) {
        pending.push(dependant);

    } else {
        for (var i = 0; i < oldProviders.length; i++) {

            if (oldProviders[i] !== dependant._providers[i]) {
                pending.push(dependant);
                break;
            }
        }
    }

};
/**
 * mark the behaviour that it is no longer being used it will no longer recieve update
 * notifications
 * 
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 */

recoil.frp.TransactionManager.prototype.detach = function(behaviour) {

};
