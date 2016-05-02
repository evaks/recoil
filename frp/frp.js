goog.provide('recoil.frp');
goog.provide('recoil.frp.BStatus');
goog.provide('recoil.frp.Behaviour');
goog.provide('recoil.frp.EStatus');
goog.provide('recoil.frp.Frp');
goog.provide('recoil.frp.TransactionManager');

goog.require('goog.array');
goog.require('goog.math.Long');
goog.require('recoil.exception.InvalidState');
goog.require('recoil.exception.LoopDetected');
goog.require('recoil.exception.NoAccessors');
goog.require('recoil.exception.NotAttached');
goog.require('recoil.exception.NotInTransaction');
goog.require('recoil.structs.UniquePriorityQueue');
goog.require('recoil.util');

/**
 * recoil.frp.TraverseDirection.
 *
 * @param {!string} name
 * @param {function(recoil.frp.Behaviour,Array <recoil.frp.Behaviour>, Array <recoil.frp.Behaviour>) : Array<recoil.frp.Behaviour>}
 *            calc
 *
 * @param {function(recoil.frp.Behaviour,recoil.frp.Behaviour):number} comparator
 * @constructor
 */

recoil.frp.TraverseDirection = function(name, calc, comparator) {
    this.calc_ = calc;
    this.comparator_ = comparator;
};

/**
 *
 * @param {recoil.frp.Behaviour} behaviour
 * @param {Array <recoil.frp.Behaviour>} providers
 * @param {Array <recoil.frp.Behaviour>} dependents
 * @return {Array <recoil.frp.Behaviour>}
 */
recoil.frp.TraverseDirection.prototype.calculate = function(behaviour, providers, dependents) {
    return this.calc_(behaviour, providers, dependents);
};

/**
 *
 * @return {function(recoil.frp.Behaviour,recoil.frp.Behaviour):number}
 */

recoil.frp.TraverseDirection.prototype.heapComparator = function() {
    var me = this;
    return function(a, b) {
        return me.comparator_(a, b);
    };
};
/**
 *
 * @constructor
 */
recoil.frp.Frp = function() {
    this.transactionManager_ = new recoil.frp.TransactionManager(this);

};

/**
 * make a value if it is not a behaviour into a behaviour
 * @template T
 * @param  {recoil.frp.Behaviour<T>|T} behaviourOrValue
 * @param {T=} opt_default value to set if the behaviour or value is null or undefined
 * @return {recoil.frp.Behaviour<T>}
 */

recoil.frp.Frp.prototype.makeBehaviour = function(behaviourOrValue, opt_default) {
    if (behaviourOrValue instanceof recoil.frp.Behaviour) {
        return behaviourOrValue;
    }
    if (opt_default !== undefined) {
        if (behaviourOrValue === undefined || behaviourOrValue === null) {
            return this.createConstB(opt_default);
        }
    }
    return this.createConstB(behaviourOrValue);
};

/**
 *
 * @return {recoil.frp.TransactionManager}
 */
recoil.frp.Frp.prototype.tm = function() {
    return this.transactionManager_;
};

/**
 * mark the behaviour that it is being used it will now recieve update notifications
 *
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 *
 */
recoil.frp.Frp.prototype.attach = function(behaviour) {
    this.transactionManager_.attach(behaviour);
};

/**
 * mark the behaviour that it is no longer being used it will not recieve update notifications
 *
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 *
 */
recoil.frp.Frp.prototype.detach = function(behaviour) {
    this.transactionManager_.detach(behaviour);
};
/**
 * @interface
 * an base interface EStatus (Event Status) and BStatus (Behaviour Status)
 *
 */
recoil.frp.Status = function() {};

/**
 * @return {!Array<*>}
 */
recoil.frp.Status.prototype.errors = function() {};
/**
 * @return {boolean}
 */
recoil.frp.Status.prototype.ready = function() {};

/**
 * @return {*}
 */
recoil.frp.Status.prototype.get = function() {};

/**
 * @param {*} value
 */
recoil.frp.Status.prototype.set = function(value) {};


/**
 * @param {*} error
 */
recoil.frp.Status.prototype.addError = function(error) {};

/**
 * provides the status of the event, e.g. is it ready, or an error has occured
 * events are cleared every pass off of the transaction, up or down
 * events are different than behaviours the contain a queue of values
 * @template T
 * @implements {recoil.frp.Status}
 * @param {!boolean} generator if true this is only clears after up event
 * @param {Array<T>=} opt_values
 * @constructor
 *
 */
recoil.frp.EStatus = function(generator, opt_values) {
    this.generator_ = generator;
    this.errors_ = [];
    this.values_ = opt_values || [];
};

/**
 * creates a not ready event
 * @param {!boolean} generator if true this is only clears after up event
 * @return {recoil.frp.EStatus}
 */
recoil.frp.EStatus.notReady = function(generator) {
    return new recoil.frp.EStatus(generator);
};

/**
 * no errors on events, the event itself can be an error
 * thou
 * @return {Array<*>}
 */
recoil.frp.EStatus.prototype.errors = function() {
    return this.errors_;
};
/**
 * @param {*} error
 */
recoil.frp.EStatus.prototype.addError = function(error) {
    this.errors_.push(error);
};

/**
 * @return {boolean}
 */
recoil.frp.EStatus.prototype.ready = function() {
    return this.values_.length > 0;
};

/**
 * @return {?Array<T>}
 */
recoil.frp.EStatus.prototype.get = function() {
    if (this.values_.length === 0) {
        return null;
    }
    return this.values_;
};

/**
 * @param {T} value
 * @return {recoil.frp.EStatus<T>}
 */
recoil.frp.EStatus.prototype.addValue = function(value) {
    var values = goog.array.clone(this.values_);
    values.push(value);
    return new recoil.frp.EStatus(this.generator_, values);

};

/**
 * @param {T} value
 */
recoil.frp.EStatus.prototype.set = function(value) {

    this.values_.push(value);
};
/**
 * combine this error and another to get a result
 *
 * @param {!recoil.frp.Status} other
 */
recoil.frp.EStatus.prototype.merge = function(other) {
    this.errors_ = goog.array.concat(this.errors_, other.errors());
};
/**
 * @private
 * @param {!recoil.frp.Direction_} dir
 */
recoil.frp.EStatus.prototype.clear_ = function(dir) {
    if (dir === recoil.frp.Frp.Direction_.UP || !this.generator_) {
        this.errors_ = [];
        this.values_ = [];
    }
};
/**
 *
 * provides the status of the behaviour, e.g. is it ready, or an error occured
 *
 * @implements {recoil.frp.Status}
 * @param {T} initial
 * @constructor
 * @template T
 */
recoil.frp.BStatus = function(initial) {
    this.errors_ = [];
    /** @type !boolean
     @private*/
    this.ready_ = true;
    this.value_ = initial;
};


/**
 * @return {recoil.frp.BStatus}
 */
recoil.frp.BStatus.notReady = function()  {
    var res = new recoil.frp.BStatus(undefined);
    res.ready_ = false;
    return res;
};
/**
 * @param {Array<*>} errors
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.BStatus.errors = function(errors) {
    var res = new recoil.frp.BStatus(undefined);
    res.ready_ = true;
    res.errors_ = errors;
    return res;
};


/**
 * combine this error and another to get a result
 *
 * @param {recoil.frp.Status} other
 */
recoil.frp.BStatus.prototype.merge = function(other) {
    this.errors_ = goog.array.concat(this.errors_, other.errors());
    this.ready_ = this.ready_ && other.ready();
};

/**
 * set the of the status
 *
 * @param {T} val
 */
recoil.frp.BStatus.prototype.set = function(val) {
    this.value_ = val;
};

/**
 * @return {T}
 */
recoil.frp.BStatus.prototype.get = function() {
    return this.value_;
};

/**
 *
 * @return {!boolean}
 */
recoil.frp.BStatus.prototype.ready = function() {
    return this.ready_;
};

/**
 *
 * @return {boolean}
 */
recoil.frp.BStatus.prototype.good = function() {
    return this.ready_ && this.errors_.length === 0;
};
/**
 * @nosideeffects
 * @return  {Array<*>} current errors
 */
recoil.frp.BStatus.prototype.errors = function() {
    return this.errors_;
};
/**
 * @param {*} error
 */
recoil.frp.BStatus.prototype.addError = function(error) {
    this.errors_.push(error);
};
/**
 * @private
 * @param {Array<goog.math.Long>} a
 * @param {Array<goog.math.Long>} b
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
 *
 * @enum {recoil.frp.TraverseDirection}
 * @private
 * @final
 */

recoil.frp.Frp.Direction_ = {};

/**
 * Up is from providers to behaviour
 *
 * @final
 */
recoil.frp.Frp.Direction_.UP = new recoil.frp.TraverseDirection(
    'up',
    /**
     * @param {recoil.frp.Behaviour} behaviour
     * @param {Array <recoil.frp.Behaviour>} providers
     * @param {Array <recoil.frp.Behaviour>} dependents
     * @return {Array <recoil.frp.Behaviour>}
     */
    function(behaviour, providers, dependents) {
        var oldVal = behaviour.val_;

        var params = [];
        // TODO put a loop around this so we get all events, take care if we clear the events
        // other behaviours may not get the events so we have to probably queue them unless
        // we consider an event as always a seqenence of events, then the lift just has to deal
        // with them this may allow more power to the function, alternatively events could just have
        // a sequence associated with them you only get one at a time, but this could be delt with
        // outside the engine
        providers.forEach(function(b) {
            params.push(b.metaGet());
        });
        var newVal = behaviour.calc_.apply(behaviour, params);
        var res = [];
        if (behaviour.dirtyUp_ && recoil.util.isEqual(behaviour.dirtyUpOldValue_, newVal)) {
            behaviour.val_ = behaviour.dirtyUpOldValue_;
        } else if (behaviour.dirtyUp_ || !recoil.util.isEqual(oldVal, newVal)) {
            behaviour.val_ = newVal;
            res = dependents;
        }
        behaviour.dirtyUpOldValue_ = null;
        behaviour.dirtyUp_ = false;
        return res;
    }, function(a, b) {
        return recoil.frp.Frp.compareSeq_(a.seq_, b.seq_);
    }),

/**
 * Down is from behaviour to providers
 *
 * @final
 */
recoil.frp.Frp.Direction_.DOWN = new recoil.frp.TraverseDirection('down', function(behaviour, providers, dependants) {
    function getDirty(dependants) {
        var res = {};
        for (var i = 0; i < dependants.length; i++) {
            if (dependants[i].dirtyDown_) {
                res[String(dependants[i].seq_)] = dependants[i];
            }
        }
        return res;
    }

    var changedDirty = [];
    if (behaviour.dirtyDown_) {
        var oldDirty = getDirty(behaviour.providers_);
        var args = [behaviour.val_];
        for (var i = 0; i < behaviour.providers_.length; i++) {
            args.push(behaviour.providers_[i]);
        }

        behaviour.inv_.apply(behaviour, args);
        var newDirty = getDirty(behaviour.providers_);

        var id;
        for (id in newDirty) {
            if (oldDirty[id] !== undefined) {

                changedDirty.push(newDirty[id]);
            }

        }
        behaviour.dirtyDown_ = false;
    }

    return changedDirty;
}, function(a, b) {
    return recoil.frp.Frp.compareSeq_(b.seq_, a.seq_);

});

/**
 *
 * @constructor
 * @template T
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {recoil.frp.BStatus <T>} value
 * @param {function(...) : T| undefined} calc
 * @param {function(T)| undefined} inverse
 * @param {Array <goog.math.Long>} sequence
 * @param {Array <recoil.frp.Behaviour>?} providers
 */
recoil.frp.Behaviour = function(frp, value, calc, inverse, sequence, providers) {
    var me = this;
    this.frp_ = frp;
    var myValue = value;
    this.val_ = value;
    this.calc_ = calc || function() {
        return myValue;
    };
    if (!(this.calc_ instanceof Function)) {
	throw "calc not function";
    }
	
    this.inv_ = inverse || function(newVal) {
        myValue = newVal;
    };

    if (!(this.inv_ instanceof Function)) {
	throw "inverse not function";
    }

    this.dirtyUp_ = false;
    this.dirtyUpOldValue_ = null;
    this.dirtyDown_ = false;
    this.refs_ = {};
    /**
     * @type Array<goog.math.Long>
     * @private
     * @final
     */
    this.seq_ = sequence;
    /**
     * @type string
     * @private
     * @final
     */
    this.seqStr_ = String(sequence);
    this.accessors_ = 0;
    if (providers) {
        providers.forEach(function(p) {
            if (! (p instanceof recoil.frp.Behaviour)) {
                throw 'provider not a behaviour';
            }
        });
    }
    this.refListeners_ = [];
    this.providers_ = providers || [];
};

/**
 * @return {recoil.frp.Frp} the associated frp engine
 */
recoil.frp.Behaviour.prototype.frp = function() {
    return this.frp_;
};
/**
 * this adds a listener when the that behaviours come in and out of use
 * it calls the callback with true when it goes into use and false when it stops being used
 *
 * @param {function(boolean)} callback
 */
recoil.frp.Behaviour.prototype.refListen = function(callback) {
    this.refListeners_.push(callback);
};
/**
 * increases the reference count
 *
 * @param {recoil.frp.TransactionManager} manager
 * @return {boolean} true if count was zero
 *
 */
recoil.frp.Behaviour.prototype.addRef = function(manager) {

    var hadRefs = this.hasRefs();

    var curRefs = this.refs_[manager.id_];
    if (curRefs === undefined) {
        this.refs_[manager.id_] = {
            manager: manager,
            count: 1
        };
        if (!hadRefs) {
            for (var l in this.refListeners_) {
                this.refListeners_[l](true);
            }
        }
        return true;
    } else {
        this.refs_[manager.id_].count++;
        if (!hadRefs) {
            for (var l in this.refListeners_) {
                this.refListeners_[l](true);
            }
        }

        return false;
    }
};

/**
 * decreases the reference count
 *
 * @param {recoil.frp.TransactionManager} manager
 * @return {boolean} true if count goes to zero
 */
recoil.frp.Behaviour.prototype.removeRef = function(manager) {
    var curRefs = this.refs_[manager.id_];
    if (curRefs === undefined || curRefs.count <= 0) {
        goog.asserts.assert(false, 'Behaviour removing reference when not referenced');
        return false;
    } else if (curRefs.count === 1) {
        delete this.refs_[manager.id_];
        if (!this.hasRefs()) {
            for (var l in this.refListeners_) {
                this.refListeners_[l](false);
            }
        }
        return true;
    } else {
        this.refs_[manager.id_].count = curRefs.count - 1;
        return false;
    }
};

/**
 * @return {boolean}
 *
 */
recoil.frp.Behaviour.prototype.hasRefs = function() {
    for (var prop in this.refs_) {
        if (this.refs_.hasOwnProperty(prop)) {
            return true;
        }
    }
    return false;
};

/**
 * gets the reference count for the transaction manager
 *
 * @param {recoil.frp.TransactionManager} manager
 * @return {number}
 */
recoil.frp.Behaviour.prototype.getRefs = function(manager) {

    var curRefs = this.refs_[manager.id_];
    if (curRefs === undefined) {
        return 0;
    }
    return curRefs.count;
};

/**
 * gets the reference count for the transaction manager
 *
 * @private
 * @param {function(recoil.frp.TransactionManager)} callback
 */
recoil.frp.Behaviour.prototype.forEachManager_ = function(callback) {

    for (var idx in this.refs_) {
        callback(this.refs_[idx].manager);
    }
};

/**
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.Behaviour.prototype.unsafeMetaGet = function() {
    return this.val_;
};

/**
 * @return {T}
 */
recoil.frp.Behaviour.prototype.get = function() {
    var meta = this.metaGet();
    if (meta instanceof recoil.frp.BStatus) {
        return meta.get();
    }
    if (meta instanceof recoil.frp.EStatus) {
        return meta.get();
    }
    return null;
};

/**
 * @return {recoil.frp.BStatus<T>}
 */
recoil.frp.Behaviour.prototype.metaGet = function() {
    var hasTm = this.hasRefs();
    var hasProviders = this.providers_.length > 0;

    if (!hasTm && hasProviders) {
        // if it has providers then it is not ok to set it with no
        // transaction manager attached
        throw new recoil.exception.NotAttached();
    }

    if (hasProviders && this.accessors_ === 0) {
        // if providers are feeding into me then it is NOT ok just to set the value
        throw new recoil.exception.NoAccessors();
    }

    return this.val_;
};

/**
 * @param {recoil.frp.BStatus<T>} value
 */

recoil.frp.Behaviour.prototype.metaSet = function(value) {
    var hasTm = this.hasRefs();
    var hasProviders = this.providers_.length > 0;

    if (!hasTm && hasProviders) {
        // if it has providers then it is not ok to set it with no
        // transaction manager attached
        throw new recoil.exception.NotAttached();
    }

    if (hasProviders && this.accessors_ === 0) {
        // if providers are feeding into me then it is NOT ok just to set the value
        throw new recoil.exception.NoAccessors();
    }

    if (hasTm) {
        var hasTransaction = false;
        this.forEachManager_(function(manager) {
            hasTransaction = hasTransaction || manager.level_ > 0;
        });

        if (!hasTransaction) {
            throw new recoil.exception.NotInTransaction();

        }

    }
    var me = this;

    if (!recoil.util.isEqual(value, me.val_)) {
        if (!me.dirtyUp) {
            me.dirtyUp_ = true;
            me.dirtyUpOldValue_ = me.val_;
        }
        me.dirtyDown_ = true;
        me.val_ = value;

        me.forEachManager_(function(manager) {
            manager.addPending_(recoil.frp.Frp.Direction_.UP, me);
            manager.addPending_(recoil.frp.Frp.Direction_.DOWN, me);
        });
    }

};

/**
 * @param {T} value
 */

recoil.frp.Behaviour.prototype.set = function(value) {
    if (this.val_ instanceof recoil.frp.EStatus) {
        this.metaSet(this.val_.addValue(value));
    }
    else {
        this.metaSet(new recoil.frp.BStatus(value));
    }
};

/**
 * @template T
 * @param {T} initial
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createB = function(initial) {
    var metaInitial = new recoil.frp.BStatus(initial);
    return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, [this.transactionManager_.nextIndex()], []);
};
/**
 * @template T
 * create a generator event set this value to send values up the tree
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createE = function() {
    var metaInitial = recoil.frp.EStatus.notReady(true);
    return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, [this.transactionManager_.nextIndex()], []);
};
/**
 * @template T
 * @param {recoil.frp.BStatus<T>} initial
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createMetaB = function(initial) {
    return new recoil.frp.Behaviour(this, initial, undefined, undefined, [this.transactionManager_.nextIndex()], []);
};

/**
 * @template T
 * @param {T} initial
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createConstB = function(initial) {
    var metaInitial = new recoil.frp.BStatus(initial);
    return new recoil.frp.Behaviour(this, metaInitial, function() {
        return metaInitial;
    }, function(dummy) {
    }, [this.transactionManager_.nextIndex()], []);
};

/**
 * allows access to behaviours and also puts the callback in a transaction
 *
 * @param {function()} callback
 * @param {...recoil.frp.Behaviour} var_behaviours
 */

recoil.frp.Frp.prototype.accessTrans = function(callback, var_behaviours) {

    try {
        for (var i = 1; i < arguments.length; i++) {
            arguments[i].accessors_++;
        }
        this.transactionManager_.doTrans(callback);
    } finally {
        for (var i = 1; i < arguments.length; i++) {
            arguments[i].accessors_--;
        }
    }
};
/**
 * @param {function()} callback
 * @param {...recoil.frp.Behaviour} var_behaviours
 */
recoil.frp.Frp.access = function(callback, var_behaviours) {
    try {
        for (var i = 1; i < arguments.length; i++) {
            arguments[i].accessors_++;
        }
        callback();
    } finally {
        for (var i = 1; i < arguments.length; i++) {
            arguments[i].accessors_--;
        }
    }
};

/**
 * @param {function()} callback
 * @param {Array<recoil.frp.Behaviour>} behaviours
 */

recoil.frp.Frp.accessList = function(callback, behaviours) {
    try {
        for (var i = 0; i < behaviours.length; i++) {
            behaviours[i].accessors_++;
        }
        callback();
    } finally {
        for (var i = 1; i < behaviours.length; i++) {
            behaviours[i].accessors_--;
        }
    }
};

/**
 *
 * @template T
 * @param {!recoil.frp.Behaviour<recoil.frp.Behaviour<T>>} Bb
 * @return {T}
 */
recoil.frp.Frp.prototype.switchB = function(Bb) {
    var me = this;
    return this.metaLiftBI(function() {
        var switchB = this;
        /** @type recoil.frp.BStatus<recoil.frp.Behaviour> */
        var metaBb = Bb.metaGet();
        var res = new recoil.frp.BStatus(null);
        res.merge(metaBb);
        var b = null;

        me.transactionManager_.nestIds(Bb, function() {
            if (metaBb.value_ === null) {
                me.transactionManager_.updateProviders_(switchB, Bb);
            } else {
                me.transactionManager_.updateProviders_(switchB, Bb, metaBb.get());
                res.merge(metaBb);
            }
            b = metaBb.value_;
        });

        if (b !== null || b !== undefined) {
            recoil.frp.Frp.access(function() {
                res.set(b.get());
            }, b);
            return res;
        }
        return res;
    }, function(val) {
        var metaBb = Bb.metaGet();

        if (metaBb.value_ instanceof recoil.frp.Behaviour) {
            metaBb.value_.metaSet(val);
        }

    }, Bb);
};

/**
 * calls function, arguments and return value should contain meta information
 *
 * @template T
 * @param {function(...) : T} func
 * @param {...} var_args
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.metaLiftB = function(func, var_args) {
    var args = [];
    args.push(func);
    args.push(undefined);

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return this.metaLiftBI.apply(this, args);
};

/**
 * calls function, arguments and return value should contain meta information
 *
 * @template T
 * @param {function(...) : T} func
 * @param {function(T,...)} invFunc
 * @param {...} var_args
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.metaLiftBI = function(func, invFunc, var_args) {
    var providers = [];
    for (var i = 2; i < arguments.length; i++) {
        providers.push(arguments[i]);
    }
    return new recoil.frp.Behaviour(this, recoil.frp.BStatus.notReady(), func, invFunc, [this.transactionManager_.nextIndex()], providers);
};

/**
 * calls function, arguments and return value should contain meta information
 *
 * @template T
 * @param {function(...) : T} func
 * @param {function(T,...)} invFunc
 * @param {...} var_args
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.metaLiftEI = function(func, invFunc, var_args) {
    var providers = [];
    for (var i = 2; i < arguments.length; i++) {
        providers.push(arguments[i]);
    }
    return new recoil.frp.Behaviour(this, recoil.frp.EStatus.notReady(false), func, invFunc, [this.transactionManager_.nextIndex()], providers);
};

/**
 * @template RT
 * @param {function(...) : RT} func
 * @param {...number|Object|recoil.frp.Behaviour} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftB = function(func, var_args) {
    var args = [func, undefined];
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return this.liftBI.apply(this, args);
};


/**
 * @template RT
 * @param {function(...) : RT} func
 * @param {...number|Object|recoil.frp.Behaviour} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftE = function(func, var_args) {
    var args = [func, undefined];
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return this.liftEI.apply(this, args);
};

/**
 *
 * Creates callback, this is basically a behaviour with only an inverse
 * the calculate function always returns true
 * @param {function(...*)} func
 * @param {...recoil.frp.Behaviour<*>} var_dependants
 * @return {!recoil.frp.Behaviour<?>}
 */
recoil.frp.Frp.prototype.createCallback = function(func, var_dependants) {
    var params = [function() {return null;}, function(value) {return func.apply(this, arguments)}];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i]);
    }

    var b = this.liftBI.apply(this, params);
    b.type = 'callback';
    return b;
};
/**
 * takes input behaviours and makes a new behaviour
 * @template RT
 * @param {function(...) : RT} func
 * @param {function(RT,...)} invFunc
 * @param {...number|Object} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftBI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftBI, function() {
        return new recoil.frp.BStatus(null);
    }, arguments);
};

/**
 * like liftBI except returns a Status, this is useful for calculation
 * errors, inputs are still guaranteed to be good
 */
recoil.frp.Frp.prototype.statusLiftBI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftBI, null, arguments);

};

/**
 * takes input behaviours and makes a new behaviour that stores an event
 * @template RT
 * @param {function(...) : RT} func
 * @param {function(RT,...)} invFunc
 * @param {...number|Object} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftEI = function(func, invFunc, var_args) {
    return recoil.util.invokeParamsAndArray(this.liftBI_, this, this.metaLiftEI, function() {
        return new recoil.frp.EStatus(null, false);
    }, arguments);
};

/**
 * func will fire if all dependant behaviours are good or
 * or there is 1 ready event
 * @template RT
 * @private
 * @param {function(function(...) : RT, function(RT, ...), ...) : recoil.frp.Behavliour<RT>} liftFunc function to call
 * ever event or behaviour
 * @param {function() : recoil.frp.Status<RT>} statusFactory function to create an empty status
 * @param {function(...) : RT} func
 * @param {function(RT,...)} invFunc
 * @param {...number|Object} var_args
 * @return {!recoil.frp.Behaviour<RT>}
 */

recoil.frp.Frp.prototype.liftBI_ = function(liftFunc, statusFactory, func, invFunc, var_args) {
    var outerArgs = arguments;
    var wrappedFunc = function() {
        var args = [];
        var metaResult = statusFactory === null ? new recoil.frp.Behaviour(null) : statusFactory();
        var metaResultB = null;
        var eventReady = false;

        for (var i = 4; i < outerArgs.length; i++) {
            var metaArg = outerArgs[i];
            var metaArgVal = metaArg.metaGet();
            metaResult.merge(metaArgVal);

            if (metaArgVal instanceof recoil.frp.BStatus) {
                if (metaResultB === null) {
                    metaResultB = new recoil.frp.BStatus(null);
                }
                metaResultB.merge(metaArgVal);
            }
            else {
                eventReady = eventReady || metaArgVal.ready();
            }
            args.push(metaArg.get());
        }

        // fires if all provider behaviours a good
        // or we have an event that is ready, note this means


        if ((metaResultB !== null && metaResultB.good()) || eventReady) {
            try {
            var result = func.apply(this, args);
                if (statusFactory === null) {
                    // if status factory null then we expect the result a status object
                    metaResultB = result;
                }
                else {
                    metaResult.set(result);
                }
            }
            catch (error) {
		console.log(error);
                metaResult.addError(error);
            }
        }
        else {
            console.log(metaResult);
        }
        return metaResult;
    };

    var wrappedFuncInv = undefined;
    if (invFunc !== undefined) {
        wrappedFuncInv = function(val) {
            var args = [val.get()];

            for (var i = 4; i < outerArgs.length; i++) {
                args.push(outerArgs[i]);
            }
            invFunc.apply(this, args);
        };
    }
    var newArgs = [wrappedFunc, wrappedFuncInv];
    for (var i = 4; i < outerArgs.length; i++) {
        newArgs.push(outerArgs[i]);
    }

    return liftFunc.apply(this, newArgs);

};

/**
 * @constructor
 * @param {recoil.frp.Frp} frp
 *
 */
recoil.frp.TransactionManager = function(frp) {
    this.providers_ = [];
    this.level_ = 0;
    this.pending_ = [new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.UP.heapComparator()),
                     new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.UP.heapComparator())];
    this._dependancyMap = [];
    /**
     * @private
     * @type recoil.util.Sequence
     */
    this.curIndex_ = new recoil.util.Sequence();
    /**
     * @type Array<Array<goog.math.Long>>
     * @private
     */
    this.curIndexPrefix_ = [[]];
    /**
     * @type number
     * @private
     */
    this.curIndexLock_ = 0;
    this.id_ = recoil.frp.TransactionManager.nextId_.next();
    /**
     * @type recoil.frp.Frp
     * @private
     */
    this.frp_ = frp;
};

/**
 * @type goog.math.Long
 * @private
 */
recoil.frp.TransactionManager.nextId_ = new recoil.util.Sequence();

/**
 * this makes all ids generated sub ids of the current one I think this is wrong really we need it to be children of the
 * behaviour that depends on it TODO
 *
 * @template T
 * @param {recoil.frp.Behaviour<recoil.frp.Behaviour<T>>} behaviour the parent behaviour all generated sequences will
 *            be less than this
 * @param {function()} callback
 */
recoil.frp.TransactionManager.prototype.nestIds = function(behaviour, callback) {
    try {
        this.curIndexPrefix_.push(behaviour.seq_);
        callback();
    } finally {
        this.curIndexPrefix_.pop();
    }
};

/**
 * stops new ids from being created, this will stop new behaviours from being created in inappropriate places such as
 * inverse functions
 *
 * @param {function()} callback
 * @private
 */
recoil.frp.TransactionManager.prototype.lockIds_ = function(callback) {
    try {
        this.curIndexLock_++;
        callback();
    } finally {
        this.curIndexLock_--;
    }
};

/**
 * to a transaction nothing should fire until we exit out the top level
 *
 * @param {function()} callback
 *
 */

recoil.frp.TransactionManager.prototype.doTrans = function(callback) {
    this.level_++;

    try {
        callback();
    } finally {
        try {
            if (this.level_ === 1) {
                this.propagateAll_();
            }
        } finally {
            this.level_--;
        }
    }
};

/**
 * make an array of all providers of behaviour
 *
 * @template T
 * @param {!recoil.frp.Behaviour<recoil.frp.Behaviour<T>>} behaviour
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
        if (cur.b === null) {
            console.log('behaviour is: ', cur.b);
        }

        if (visited[cur.b.seqStr_] !== undefined) {
            continue;
        }
        visited[cur.b.seqStr_] = cur.b;

        for (var prov = 0; prov < cur.b.providers_.length; prov++) {
            var provObj = cur.b.providers_[prov];
            if (cur.path[String(provObj.seq_)] !== undefined) {
                throw new recoil.exception.LoopDetected();
            }

            var newPath = goog.array.clone(cur.path);
            newPath[String(provObj.seq_)] = provObj;

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
 * @return {Array<goog.math.Long>}
 */
recoil.frp.TransactionManager.prototype.nextIndex = function() {
    var res = goog.array.clone(this.curIndexPrefix_[this.curIndexPrefix_.length - 1]);
    res.push(this.curIndex_.nextLong());
    return res;
};

/**
 * @private
 * @param {!recoil.frp.TraverseDirection} direction
 * @return {recoil.structs.UniquePriorityQueue}
 */
recoil.frp.TransactionManager.prototype.getPending_ = function(direction) {
    return this.pending_[recoil.frp.Frp.Direction_.UP === direction ? 0 : 1];
};

/**
 * @param {!recoil.frp.TraverseDirection} direction
 * @param {recoil.frp.Behaviour} behaviour
 * @param {boolean=} opt_propogate
 * @private
 */
recoil.frp.TransactionManager.prototype.addPending_ = function(direction, behaviour, opt_propogate) {
    this.getPending_(direction).push(behaviour);
    if (this.level_ === 0 && opt_propogate) {
        this.propagateAll_();
    }
};

/**
 * propagate the changes through the FRP tree, until no more changes
 *
 * @private
 */
recoil.frp.TransactionManager.prototype.propagateAll_ = function() {
    var pendingDown = this.getPending_(recoil.frp.Frp.Direction_.DOWN);
    var pendingUp = this.getPending_(recoil.frp.Frp.Direction_.UP);

    while (!pendingUp.isEmpty() || !pendingDown.isEmpty()) {
        if (!pendingDown.isEmpty()) {
            this.propagate_(recoil.frp.Frp.Direction_.DOWN);
            continue;
        }

        if (!pendingUp.isEmpty()) {
            this.propagate_(recoil.frp.Frp.Direction_.UP);
            continue;
        }
    }
};

/**
 * propagate the changes through the FRP tree, the direction is if it is going up or down
 *
 * @param {!recoil.frp.TraverseDirection} dir
 * @private
 */
recoil.frp.TransactionManager.prototype.propagate_ = function(dir) {
    var pendingHeap = this.getPending_(dir);
    var visited = {};

    var cur = pendingHeap.pop();
    var me = this;
    while (cur !== undefined) {
        // calculate changed something
        var deps;
        visited[cur.seqStr_] = cur;
        var accessFunc = function() {
            if (dir === recoil.frp.Frp.Direction_.UP) {
                me.nestIds(cur, function() {
                    deps = dir.calculate(cur, cur.providers_, me._dependancyMap[String(cur.seq_)]);
                });
            } else {
                me.lockIds_(function() {
                    deps = dir.calculate(cur, cur.providers_, me._dependancyMap[String(cur.seq_)]);
                });

            }
        };

        var args = [accessFunc, cur];
        for (var i = 0; i < cur.providers_.length; i++) {
            args.push(cur.providers_[i]);
        }
        recoil.frp.Frp.access.apply(this, args);
        var d;
        for (d in deps) {
            pendingHeap.push(deps[d]);
        }

        cur = pendingHeap.pop();
    }
    this.clearEvents_(dir, visited);
};
/**
 * clear all event data after a pass
 * @private
 * @param {!recoil.frp.TraverseDirection} dir
 * @param {*} visited a map string-> behaviour
 */
recoil.frp.TransactionManager.prototype.clearEvents_ = function(dir, visited) {
    for (var id in visited) {
        var b = visited[id];
        var meta = b.unsafeMetaGet();
        if (meta instanceof recoil.frp.EStatus) {
            meta.clear_(dir);
        }
    }
};
/**
 * helper function to add the inverse mapping provider to list of dependants
 *
 * @template T
 * @private
 * @param {recoil.frp.Behaviour<T>} b
 */
recoil.frp.TransactionManager.prototype.addProvidersToDependancyMap_ = function(b) {
    var me = this;
    b.providers_.forEach(function(prov) {
        var deps = me._dependancyMap[String(prov.seq_)];
        if (deps === undefined) {
            deps = [b];
            me._dependancyMap[String(prov.seq_)] = deps;
        } else {
            deps.push(b);
        }
    });

};

/**
 * @param {Object} other
 * @this {Object}
 * @template T
 * @return {boolean} true if objects are equal
 */
recoil.frp.Frp._ptrEqual = function(other) {
    return this === other;
};

/**
 * helper function to remove the inverse mapping provider to list of dependants
 *
 * @template T
 * @private
 * @param {recoil.frp.Behaviour<T>} b
 */
recoil.frp.TransactionManager.prototype.removeProvidersFromDependancyMap_ = function(b) {
    var me = this;
    b.providers_.forEach(function(prov) {
        var deps = me._dependancyMap[String(prov.seq_)];
        if (deps !== undefined) {
            // TODO what about the same provider twice?
            goog.array.removeIf(deps, recoil.frp.Frp._ptrEqual, b);
            if (deps.length === 0) {
                delete me._dependancyMap[String(prov.seq_)];
            }
        }
    });

};

/**
 * mark the behaviour that it is being used it will now recieve update notifications
 *
 * @template T
 * @param {!recoil.frp.Behaviour<T>} behaviour
 */
recoil.frp.TransactionManager.prototype.attach = function(behaviour) {
    if (! (behaviour instanceof recoil.frp.Behaviour)) {
        throw 'you can only attach to a behaviour';
    }
    var visited = this.visit(behaviour);
    var newStuff = this.getPending_(recoil.frp.Frp.Direction_.UP);
    var me = this;
    this.doTrans(function() {
        for (var idx in visited) {
            // this may not account for 2 thing in the tree pointing to the
            // same thing
            var b = visited[idx];
            if (b.getRefs(me) === 0) {
                newStuff.push(visited[idx]);
                me.addProvidersToDependancyMap_(b);
            }
            visited[idx].addRef(me);
        }
    });
};

/**
 * update the dependaniece of the behaviour
 *
 * @private
 * @param {recoil.frp.Behaviour} dependant
 * @param {...recoil.frp.Behaviour} var_providers
 */
recoil.frp.TransactionManager.prototype.updateProviders_ = function(dependant, var_providers) {
    var oldVisited = this.visit(dependant);
    var oldProviders = goog.array.clone(dependant.providers_);
    dependant.providers_ = goog.array.clone(arguments);
    // TODO remove the first argument it is the dependant
    var newVisited = this.visit(dependant);
    /** @type recoil.frp.Behaviour */
    var b;

    var me = this;
    for (var idx in oldVisited) {
        b = oldVisited[idx];
        var newIdx = goog.array.findIndex(newVisited, recoil.frp.Frp._ptrEqual, b);
        if (newIdx === -1) {
            if (b.removeRef(this)) {
                me.removeProvidersFromDependancyMap_(b);
                me.removePending_(b);
            }
        }
    }

    var pending = this.getPending_(recoil.frp.Frp.Direction_.UP);
    for (var idx in newVisited) {
        b = newVisited[idx];
        var oldIdx = goog.array.findIndex(oldVisited, recoil.frp.Frp._ptrEqual, b);
        if (oldIdx === -1) {
            if (b.addRef(this)) {
                me.addProvidersToDependancyMap_(b);
                pending.push(b);
            }
        }
    }

    // if the providers have changed then we need to recalculate the dependant
    // even just the order

    if (oldProviders.length !== dependant.providers_.length) {
        pending.push(dependant);

    } else {
        for (var i = 0; i < oldProviders.length; i++) {

            if (oldProviders[i] !== dependant.providers_[i]) {
                pending.push(dependant);
                break;
            }
        }
    }

};
/**
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 * @private
 */
recoil.frp.TransactionManager.prototype.removePending_ = function(behaviour) {
    var up = this.getPending_(recoil.frp.Frp.Direction_.UP);
    var down = this.getPending_(recoil.frp.Frp.Direction_.DOWN);

    up.remove(behaviour);
    down.remove(behaviour);
};
/**
 * mark the behaviour that it is no longer being used it will no longer recieve update notifications
 *
 * @template T
 * @param {recoil.frp.Behaviour<T>} behaviour
 */

recoil.frp.TransactionManager.prototype.detach = function(behaviour) {
    var visited = this.visit(behaviour);
    var me = this;
    this.doTrans(function() {
        for (var idx in visited) {
            // this may not account for 2 thing in the tree pointing to the
            // same thing
            var b = visited[idx];
            if (visited[idx].removeRef(me)) {
                me.removeProvidersFromDependancyMap_(b);
                me.removePending_(b);
            }
        }
    });

};
