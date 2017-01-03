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
 * @param {function(!recoil.frp.Behaviour,!Array <!recoil.frp.Behaviour>, !Array <!recoil.frp.Behaviour>, !Array <!{behaviour: !recoil.frp.Behaviour, force:boolean}>) : !Array<!recoil.frp.Behaviour>}
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
 * @param {!recoil.frp.Behaviour} behaviour
 * @param {!Array <!recoil.frp.Behaviour>} providers
 * @param {!Array <!recoil.frp.Behaviour>} dependents
 * @param {!Array <!{behaviour : !recoil.frp.Behaviour, force: boolean}>} nextItr
 * @return {!Array <!recoil.frp.Behaviour>}
 */
recoil.frp.TraverseDirection.prototype.calculate = function(behaviour, providers, dependents, nextItr) {
    return this.calc_(behaviour, providers, dependents, nextItr);
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
 * @param {!recoil.frp.Behaviour<T>} behaviour
 *
 */
recoil.frp.Frp.prototype.attach = function(behaviour) {
    this.transactionManager_.attach(behaviour);
};

/**
 * mark the behaviour that it is no longer being used it will not recieve update notifications
 *
 * @template T
 * @param {!recoil.frp.Behaviour<T>} behaviour
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
 * @return {!recoil.frp.Status}
 */
recoil.frp.Status.prototype.set = function(value) {};


/**
 * @param {?} value
 * @private
 */
recoil.frp.Status.prototype.set_ = function(value) {};

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
 * @return {!recoil.frp.EStatus}
 */
recoil.frp.EStatus.notReady = function(generator) {
    return new recoil.frp.EStatus(generator);
};

/**
 * no errors on events, the event itself can be an error
 * thou
 * @return {!Array<*>}
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
    return this.values_;
};

/**
 * @param {T} value
 * @return {!recoil.frp.EStatus<T>}
 */
recoil.frp.EStatus.prototype.addValue = function(value) {
    var values = goog.array.clone(this.values_);
    values.push(value);
    return new recoil.frp.EStatus(this.generator_, values);

};

/**
 * @param {T} value
 * @return {!recoil.frp.Status}
 */
recoil.frp.EStatus.prototype.set = function(value) {

    this.values_.push(value);
    return this;
};

/**
 * @param {?} value
 * @private
 */
recoil.frp.EStatus.prototype.set_ = function(value) {
    for (var i = 0; i < value.length; i++) {
        this.values_.push(value[i]);
    }
    this.ready_ = value.length > 0;
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
 * @param {!recoil.frp.TraverseDirection} dir
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
 * @return {!recoil.frp.BStatus}
 */
recoil.frp.BStatus.notReady = function()  {
    var res = new recoil.frp.BStatus(undefined);
    res.ready_ = false;
    return res;
};
/**
 * @template T
 * @param {!Array<*>} errors
 * @return {!recoil.frp.BStatus<T>}
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
    if (!other || !other.errors) {
        console.log('merging with non error');
    }
    this.errors_ = goog.array.concat(this.errors_, other.errors());
    this.ready_ = this.ready_ && other.ready();
};

/**
 * set the of the status
 *
 * @param {T} val
 * @return {!recoil.frp.Status}
 */
recoil.frp.BStatus.prototype.set = function(val) {
    this.value_ = val;
    return this;
};

/**
 * set the of the status
 * @private
 * @param {?} val
 */
recoil.frp.BStatus.prototype.set_ = function(val) {
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
 * @return  {!Array<*>} current errors
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
        var res = a[i].compare(b[i]);

        if (res !== 0) {
            return res;
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
     * @param {!recoil.frp.Behaviour} behaviour
     * @param {!Array <!recoil.frp.Behaviour>} providers
     * @param {!Array <!recoil.frp.Behaviour>} dependents
     * @param {!Array <!{behaviour:!recoil.frp.Behaviour, force:boolean}>} nextItr things to be queue no the next iteration not this one
     * @return {!Array <!recoil.frp.Behaviour>}
     */
    function(behaviour, providers, dependents, nextItr) {
        var oldVal = behaviour.val_;
        var getDirty = recoil.frp.Frp.Direction_.getDirtyDown;

        var params = [];
        // TODO put a loop around this so we get all events, take care if we clear the events
        // other behaviours may not get the events so we have to probably queue them unless
        // we consider an event as always a seqenence of events, then the lift just has to deal
        // with them this may allow more power to the function, alternatively events could just have
        // a sequence associated with them you only get one at a time, but this could be delt with
        // outside the engine xxx
        providers.forEach(function(b) {
            params.push(b.metaGet());
        });
        var oldDirty = getDirty(behaviour.providers_);
        var newVal;

        if (behaviour.dirtyDown_) {
            // do nothing here calulationg here is pointless since we need to recalc anyway
            // but ensure we calculate it next phase
            newVal = behaviour.val_;
            nextItr.push({behaviour: behaviour, force: true});

        }
        else {
            newVal = behaviour.calc_.apply(behaviour, params);
            if (!newVal) {
                console.log('ERROR newVal should be status');
                behaviour.calc_.apply(behaviour, params);
            }
        }

        var newDirty = getDirty(behaviour.providers_);
        for (var p in newDirty) {
            if (oldDirty[p] === undefined) {
                var prov = newDirty[p];
                nextItr.push({behaviour: prov, force: false});
            }
        }
        var res = [];
        if (behaviour.dirtyUp_ && recoil.util.isEqual(behaviour.dirtyUpOldValue_, newVal)) {
            if (behaviour.dirtyUpOldValue_ === undefined) {
                console.log('SETTING UNDEFINED 2');
            }
            behaviour.val_ = behaviour.dirtyUpOldValue_;
        } else if (behaviour.dirtyUp_ || !recoil.util.isEqual(oldVal, newVal)) {
            if (newVal === undefined) {
                console.log('SETTING UNDEFINED 2');
            }
            behaviour.val_ = newVal;
            res = dependents;
        }
        behaviour.dirtyUpOldValue_ = null;
        behaviour.dirtyUp_ = false;
        return res;
    }, function(a, b) {
        return recoil.frp.Frp.compareSeq_(a.seq_, b.seq_);
    });

/**
 * a function to get dirty down providers, this is useful inorder to see what values have been set
 * in a callback
 * @param {!Array<!recoil.frp.Behaviour>} dependants
 * @return {Object<string, !recoil.frp.Behaviour>}
 */
recoil.frp.Frp.Direction_.getDirtyDown = function(dependants) {
    var res = {};
    for (var i = 0; i < dependants.length; i++) {
        if (dependants[i].dirtyDown_) {
            res[dependants[i].seqStr_] = dependants[i];
        }
    }
    return res;
};

/**
 * Down is from behaviour to providers
 *
 * @final
 */
recoil.frp.Frp.Direction_.DOWN = new recoil.frp.TraverseDirection(
    'down',
    /**
     * @param {!recoil.frp.Behaviour} behaviour
     * @param {!Array <!recoil.frp.Behaviour>} providers
     * @param {!Array <!recoil.frp.Behaviour>} dependants
     * @param {!Array <!{behaviour:!recoil.frp.Behaviour, force:boolean}>} nextItr things to be queue no the next iteration not this one
     * @return {!Array <!recoil.frp.Behaviour>}
     */
    function(behaviour, providers, dependants, nextItr) {

        var getDirty = recoil.frp.Frp.Direction_.getDirtyDown;
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
 * @param {!recoil.frp.Frp} frp the frp engine
 * @param {!recoil.frp.Status <T>} value
 * @param {function(...) : T| undefined} calc
 * @param {function(T)| undefined} inverse
 * @param {Array <goog.math.Long>} sequence
 * @param {Array <recoil.frp.Behaviour>?} providers
 */
recoil.frp.Behaviour = function(frp, value, calc, inverse, sequence, providers) {
    var me = this;
    this.frp_ = frp;
    var myValue = value;

    if (value === undefined) {
        console.log('SETTING UNDEFINED 3');
    }

    this.val_ = value;
    this.calc_ = calc || function() {
        return myValue;
    };
    if (!(this.calc_ instanceof Function)) {
        throw 'calc not function';
    }

    this.inv_ = inverse || function(newVal) {
        myValue = newVal;
    };

    if (!(this.inv_ instanceof Function)) {
        throw 'inverse not function';
    }


    this.dirtyUp_ = false;
    this.dirtyUpOldValue_ = null;
    this.dirtyDown_ = false;
    this.refs_ = {};
    /**
     * @type {Array<goog.math.Long>}
     * @private
     */
    this.seq_ = sequence;
    /**
     * @type string
     * @private
     */
    this.seqStr_ = String(sequence).toString();
    this.origSeq_ = this.seqStr_;
    this.accessors_ = 0;
    if (providers) {
        providers.forEach(function(p) {
            if (! (p instanceof recoil.frp.Behaviour)) {
                throw new Error('provider not a behaviour');
            }
        });
    }
    this.refListeners_ = [];
    this.providers_ = providers || [];

    this.quickLoopCheck_();
};

/**
 * @param {Object<string,recoil.frp.Behaviour>} path
 */
recoil.frp.Behaviour.prototype.loopCheck = function(path) {
    if (path[this.seqStr_] !== undefined) {
        throw new recoil.exception.LoopDetected();
    }
    path = goog.object.clone(path);
    path[this.seqStr_] = this;

    for (var i = 0; i < this.providers_.length; i++) {
        this.providers_[i].loopCheck(path);
    }

};

/**
 * loopCheck is a bit slow when it comes to large amounts of
 * items this is a quicker version that assumes all the providers
 * do not have any loops so the only loop that can be introduced must point to source
 * @private
 */
recoil.frp.Behaviour.prototype.quickLoopCheck_ = function() {
    var stack = [];
    var seen = {};

    for (var i = 0; i < this.providers_.length; i++) {
        stack.push(this.providers_[i]);
    }

    while (stack.length > 0) {
        var cur = stack.pop();
        if (cur === this) {
            throw new recoil.exception.LoopDetected();
        }
        if (seen[cur.seqStr_]) {
            continue;
        }
        for (i = 0; i < cur.providers_.length; i++) {
            stack.push(cur.providers_[i]);
        }
    }



};

/**
 * a utility function to print out an frp node when it changes
 * @template T
 * @param {string} name
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Behaviour.prototype.debug = function(name) {
    var behaviour = this;
    return behaviour.frp().metaLiftBI(
        function() {
            if (behaviour.metaGet().good()) {
                console.log(name, 'calc', behaviour.get());
            }
            else {
                console.log(name, 'calc (not good)', behaviour.metaGet());
            }
            return behaviour.metaGet();
        },
        function(val) {
            console.log(name, 'inv', val);
            behaviour.metaSet(val);
        }, behaviour);
};

/**
 * @return {!recoil.frp.Frp} the associated frp engine
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
 * @param {number=} opt_count this can add more than 1 used internally
 * @return {boolean} true if count was zero
 *
 */
recoil.frp.Behaviour.prototype.addRef = function(manager, opt_count) {
    var count = opt_count === undefined ? 1 : opt_count;
    var hadRefs = this.hasRefs();
    manager.watching_ += count;
    var curRefs = this.refs_[manager.id_];
    if (curRefs === undefined) {
        this.refs_[manager.id_] = {
            manager: manager,
            count: count
        };
        if (!hadRefs) {
            for (var l = 0; l < this.refListeners_.length; l++) {
                this.refListeners_[l](true);
            }
        }
        return true;
    } else {
        this.refs_[manager.id_].count += count;
        if (!hadRefs) {
            for (var l = 0; l < this.refListeners_.length; l++) {
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
 * @param {number=} opt_count this can remove than 1 used internally
 * @return {boolean} true if count goes to zero
 */
recoil.frp.Behaviour.prototype.removeRef = function(manager, opt_count) {
    var curRefs = this.refs_[manager.id_];
    var count = opt_count === undefined ? 1 : opt_count;
    manager.watching_ -= count;

    if (curRefs === undefined || curRefs.count < count) {
        goog.asserts.assert(false, 'Behaviour ' + this.origSeq_ + ' removing reference when not referenced');
        return false;
    } else if (curRefs.count === count) {
        delete this.refs_[manager.id_];
        if (!this.hasRefs()) {
            for (var l = 0; l < this.refListeners_.length; l++) {
                this.refListeners_[l](false);
            }
        }
        return true;
    } else {
        this.refs_[manager.id_].count = curRefs.count - count;
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
 * @return {recoil.frp.Status<T>}
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
 * @return {recoil.frp.Status<T>}
 */
recoil.frp.Behaviour.prototype.metaGet = function() {
    var hasTm = this.hasRefs();
    var hasProviders = this.providers_.length > 0;

    if (!hasTm && hasProviders) {
        // if it has providers then it is not ok to set it with no
        // transaction manager attached
        throw new recoil.exception.NotAttached();
    }

    if (this.accessors_ === 0) {
        // if providers are feeding into me then it is NOT ok just to set the value
        var acc = new recoil.exception.NoAccessors();

        throw acc;
    }

    return this.val_;
};

/**
 * @param {!recoil.frp.Status<T>} value
 */

recoil.frp.Behaviour.prototype.metaSet = function(value) {
    var hasTm = this.hasRefs();
    var hasProviders = this.providers_.length > 0;

    if (!value) {
        throw 'value must be of type status';
    }
    if (!hasTm && hasProviders) {
        // if it has providers then it is not ok to set it with no
        // transaction manager attached
        throw new recoil.exception.NotAttached();
    }

    if (hasProviders && this.accessors_ === 0) {
        // if providers are feeding into me then it is NOT ok just to set the value
        var acc = new recoil.exception.NoAccessors();

        throw acc;
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
        if (hasTm) {
            if (!me.dirtyUp_) {
                me.dirtyUp_ = true;
                me.dirtyUpOldValue_ = me.val_;
            }
            me.dirtyDown_ = true;
            if (value === undefined) {
                console.log('SETTING UNDEFINED');
            }
            me.val_ = value;
            me.forEachManager_(function(manager) {
                manager.addPending_(recoil.frp.Frp.Direction_.UP, me);
                manager.addPending_(recoil.frp.Frp.Direction_.DOWN, me);
            });

        }
        else {
            // we don't have a transaction we are simple
            // and nobody is listening so just set my value
            // and calculate down
            if (value === undefined) {
                console.log('SETTING UNDEFINED');
            }
            me.val_ = value;
            if (value instanceof recoil.frp.BStatus) {
                // events don't do this they get cleared anyway
                // so if you are not in a transaction leave it
                me.inv_(value);
            }
        }

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
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createB = function(initial) {
    var metaInitial = new recoil.frp.BStatus(initial);
    return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
};
/**
 * helper function to create a behaviour that is not ready
 * @template T
 * @return {!recoil.frp.Behaviour<T>}
 */

recoil.frp.Frp.prototype.createNotReadyB = function() {
    var metaInitial = recoil.frp.BStatus.notReady();
    return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
};

/**
 * @template T
 * create a generator event set this value to send values up the tree
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createE = function() {
    var metaInitial = recoil.frp.EStatus.notReady(true);
    return new recoil.frp.Behaviour(this, metaInitial, undefined, undefined, this.transactionManager_.nextIndex(), []);
};
/**
 * @template T
 * @param {!recoil.frp.BStatus<T>} initial
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createMetaB = function(initial) {
    return new recoil.frp.Behaviour(this, initial, undefined, undefined, this.transactionManager_.nextIndex(), []);
};

/**
 * @template T
 * @param {T} initial
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Frp.prototype.createConstB = function(initial) {
    var metaInitial = new recoil.frp.BStatus(initial);
    return new recoil.frp.Behaviour(this, metaInitial, function() {
        return metaInitial;
    }, function(dummy) {
    }, this.transactionManager_.nextIndex(), []);
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
        for (i = 1; i < arguments.length; i++) {
            arguments[i].accessors_--;
        }
    }
};
/**
 * @param {function()} callback
 * @param {...recoil.frp.Behaviour} var_behaviours
 */
recoil.frp.Frp.access = function(callback, var_behaviours) {
    for (var i = 1; i < arguments.length; i++) {
        if (!(arguments[i] instanceof recoil.frp.Behaviour)) {
            throw 'All arguments must be a behaviour';
        }
    }
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

var xxxx = null;
/**
 *
 * @template T
 * @param {!recoil.frp.Behaviour<!recoil.frp.Behaviour<T>>} Bb
 * @return {T}
 */
recoil.frp.Frp.prototype.switchB = function(Bb) {
    var me = this;
    var res1 = this.metaLiftBI(function() {
        var switchB = this;
        /** @type recoil.frp.Status<recoil.frp.Behaviour<recoil.frp.Behaviour>> */
        var metaBb = Bb.metaGet();
        var res = new recoil.frp.BStatus(null);
        res.merge(metaBb);
        var b = null;
        me.transactionManager_.nestIds(Bb, function() {
            if (metaBb.value_ === null || !metaBb.good()) {
                me.transactionManager_.updateProviders_(switchB, Bb);
            } else {
                me.transactionManager_.updateProviders_(switchB, Bb, /** @type recoil.frp.Behaviour */ (metaBb.get()));
                res.merge(metaBb);
            }
            b = metaBb.value_;
        });

        if (b !== null && b !== undefined) {

            recoil.frp.Frp.access(function() {
                res.merge(b.metaGet());
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
    res1.isSwitch = true;
    return res1;
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
    return new recoil.frp.Behaviour(this, recoil.frp.BStatus.notReady(), func, invFunc, this.transactionManager_.nextIndex(), providers);
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
    return new recoil.frp.Behaviour(this, recoil.frp.EStatus.notReady(false), func, invFunc, this.transactionManager_.nextIndex(), providers);
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
 * @param {...recoil.frp.Behaviour<?>} var_dependants
 * @return {!recoil.frp.Behaviour<?>}
 */
recoil.frp.Frp.prototype.createCallback = function(func, var_dependants) {
    recoil.util.notNull(arguments);
    var params = [function() {return null;}, function(value) {
        return func.apply(this, arguments);
    }];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i]);
    }

    var b = this.liftBI.apply(this, params);
    b.type = 'callback';
    return b;
};


/**
 *
 * Creates callback, this is basically a behaviour with only an inverse
 * the calculate function always returns true, this differs from createCallback in that
 * the providers don't have to be good for it to be good
 * @param {function(...*)} func
 * @param {...recoil.frp.Behaviour<?>} var_dependants
 * @return {!recoil.frp.Behaviour<?>}
 */
recoil.frp.Frp.prototype.createGoodCallback = function(func, var_dependants) {
    recoil.util.notNull(arguments);
    var params = [function() {return new recoil.frp.BStatus(null);}, function(value) {return func.apply(this, arguments)}];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i]);
    }

    var b = this.metaLiftBI.apply(this, params);
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
 * @template RT
 * @param {function(...) : recoil.frp.Status<RT>} func
 * @param {function(RT, ...)} invFunc
 * @param {...!recoil.frp.Behaviour} var_args
 * @return {!recoil.frp.Behaviour<RT>}
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
        return new recoil.frp.EStatus(false);
    }, arguments);
};

/**
 * @param {IArrayLike} args
 * @param {!recoil.frp.Status=} opt_result
 * @return {!recoil.frp.Status}
 */

recoil.frp.Frp.prototype.mergeErrors = function(args, opt_result) {
    var metaResult = opt_result || new recoil.frp.BStatus(null);
    var metaResultB = null;
    var eventReady = false;


    for (var i = 0; i < args.length; i++) {
        var metaArgVal = args[i];
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
    }
    return metaResult;

};
/**
 * func will fire if all dependant behaviours are good or
 * or there is 1 ready event
 * @template RT
 * @private
 * @param {function(function(...) : RT, function(RT, ...), ...) : !recoil.frp.Behaviour<RT>} liftFunc function to call
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
        var metaResult = statusFactory === null ? new recoil.frp.BStatus(null) : statusFactory();
        var metaResultB = null; // the result of all the behaviours
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
                    metaResult = result;
                }
                else {
                    metaResult.set_(result);
                }
            }
            catch (error) {
                console.log(error);
                metaResult.addError(error);
            }
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
    this.watching_ = 0;
    this.pending_ = [new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.UP.heapComparator()),
                     new recoil.structs.UniquePriorityQueue(recoil.frp.Frp.Direction_.DOWN.heapComparator())];
    this.dependancyMap_ = {};
    /**
     * @private
     * @type recoil.util.Sequence
     */
    this.curIndex_ = new recoil.util.Sequence();
    /**
     * @type {Array<Array<goog.math.Long>>}
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
 * for debug purposes returns the number of items we are watching
 *
 * @return {number}
 */
recoil.frp.TransactionManager.prototype.watching = function() {
    return this.watching_;
};

/**
 * @type recoil.util.Sequence
 * @private
 */
recoil.frp.TransactionManager.nextId_ = new recoil.util.Sequence();

/**
 * this makes all ids generated sub ids of the current one I think this is wrong really we need it to be children of the
 * behaviour that depends on it TODO
 *
 * @template T
 * @param {recoil.frp.Behaviour<!recoil.frp.Behaviour<T>>} behaviour the parent behaviour all generated sequences will
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
 * @param {!recoil.frp.Behaviour<T>} behaviour
 * @return {Object<string, recoil.frp.Behaviour> }
 */
recoil.frp.TransactionManager.prototype.visit = function(behaviour) {

    var toDo = [{
        b: behaviour,
        path: {}
    }];
    var visited = {};

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
            // loop check seems to take a long time we shouldn't need it since
            // the constructor of the behaviour checks anyway
//            if (cur.path[provObj.seqStr_] !== undefined) {
//                throw new recoil.exception.LoopDetected();
//            }

//            var newPath = goog.object.clone(cur.path);
  //          newPath[provObj.seqStr_] = provObj;
            toDo.push({
                b: provObj
    //            path: newPath
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
    var wasUp = false;
    var wasDown = false;

    while (!pendingUp.isEmpty() || !pendingDown.isEmpty()) {
        if (!pendingDown.isEmpty() && !wasDown) {
            this.propagate_(recoil.frp.Frp.Direction_.DOWN);
            wasUp = false;
            wasDown = true;
            continue;
        }

        if (!pendingUp.isEmpty() && !wasUp) {
            this.propagate_(recoil.frp.Frp.Direction_.UP);
            wasUp = true;
            wasDown = false;
            continue;
        }
            wasUp = false;
            wasDown = false;
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
    var nextPending = new recoil.structs.UniquePriorityQueue(dir.heapComparator());
    var visited = {};

    var cur = pendingHeap.pop();
    var prev = null;
    var me = this;
    var heapComparator = dir.heapComparator();
    while (cur !== undefined) {
        // calculate changed something
        var deps;
        visited[cur.seqStr_] = cur;
        var nextItr = [];
        var accessFunc = function() {
            if (dir === recoil.frp.Frp.Direction_.UP) {
                me.nestIds(cur, function() {
                    deps = dir.calculate(cur, cur.providers_, me.dependancyMap_[cur.seqStr_], nextItr);
                });
            } else {
                me.lockIds_(function() {
                    deps = dir.calculate(cur, cur.providers_, me.dependancyMap_[cur.seqStr_], nextItr);
                });

            }
        };

        var args = [accessFunc, cur];
        for (var i = 0; i < cur.providers_.length; i++) {
            args.push(cur.providers_[i]);
        }
        recoil.frp.Frp.access.apply(this, args);
        var d;
        for (d = 0; deps && d < deps.length; d++) {
            pendingHeap.push(deps[d]);
        }

        for (d = 0; d < nextItr.length; d++) {
            var it = nextItr[d];
            var next = pendingHeap.remove(it.behaviour);
            if (next) {
                nextPending.push(next);
            }
            else if (it.force) {
                nextPending.push(it.behaviour);
            }
        }
        prev = cur;
        cur = pendingHeap.pop();
    }
    // put this on for later
    cur = nextPending.pop();
    while (cur !== undefined) {
        pendingHeap.push(cur);
        cur = nextPending.pop();
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
 * @param {!recoil.frp.Behaviour<T>} b
 * @param {!recoil.frp.Behaviour<T>=} opt_provider
 */
recoil.frp.TransactionManager.prototype.addProvidersToDependancyMap_ = function(b, opt_provider) {
    var me = this;
    var doAdd = function(prov) {
        var deps = me.dependancyMap_[prov.seqStr_];
        if (deps === undefined) {
            deps = [b];
            me.dependancyMap_[prov.seqStr_] = deps;
        } else {
            if (goog.array.indexOf(deps, b) === -1) {
                deps.push(b);
            }
        }
    };

    if (opt_provider) {
        doAdd(opt_provider);
    }
    else {
        b.providers_.forEach(doAdd);
    }
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
 * @param {!recoil.frp.Behaviour<T>=} opt_provider
 */
recoil.frp.TransactionManager.prototype.removeProvidersFromDependancyMap_ = function(b, opt_provider) {
    var me = this;
    var doRemove = function(prov) {
        var deps = me.dependancyMap_[prov.seqStr_];
        if (deps !== undefined) {
            // TODO what about the same provider twice? i think it ok
            // because we always use visited so we only ever count
            // each child once
            goog.array.removeIf(deps, recoil.frp.Frp._ptrEqual, b);
            if (deps.length === 0) {
                delete me.dependancyMap_[String(prov.seq_)];
            }
        }
    };
    if (opt_provider) {
        doRemove(opt_provider);
    }
    else {
        b.providers_.forEach(doRemove);
    }

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
    // if this is a keyed behaviour that is not already in the attached
    // behaviours and there already exists a behaviour TODO what if we attached
    // but not at the top level

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
 * @param {!recoil.frp.Behaviour} dependant
 * @param {...recoil.frp.Behaviour} var_providers
 */
recoil.frp.TransactionManager.prototype.updateProviders_ = function(dependant, var_providers) {
    var count = dependant.getRefs(this);
    var oldVisited = this.visit(dependant);
    var oldProviders = goog.array.clone(dependant.providers_);
    dependant.providers_ = goog.array.clone(arguments);
    dependant.providers_.shift();
    dependant.providers_.forEach(function(v) {
        if (!(v instanceof recoil.frp.Behaviour)) {
            throw 'provider not a behaviour in switch for ' + dependant.origSeq_;
        }
    });
    var newVisited = this.visit(dependant);
    /** @type recoil.frp.Behaviour */
    var b;

    var me = this;
    var oldProvMap = {};
    var newProvMap = {};

    if (dependant.hasRefs()) {
        for (var i = 0; i < oldProviders.length; i++) {
            oldProvMap[oldProviders[i].seqStr_] = oldProviders[i];
        }

        for (i = 0; i < dependant.providers_.length; i++) {
            newProvMap[dependant.providers_[i].seqStr_] = dependant.providers_[i];
        }

        for (var seq in oldProvMap) {
            if (!newProvMap[seq]) {
                me.removeProvidersFromDependancyMap_(dependant, oldProvMap[seq]);
            }
        }
        for (seq in newProvMap) {
            if (!oldProvMap[seq]) {
                me.addProvidersToDependancyMap_(dependant, newProvMap[seq]);
            }
        }
    }


    for (var idx in oldVisited) {
        b = oldVisited[idx];
        var newIdx = newVisited[b.seqStr_];
        if (!newIdx) {
            if (b.removeRef(this, count)) {
                me.removeProvidersFromDependancyMap_(b);
                me.removePending_(b);
            }
        }
    }

    var pending = this.getPending_(recoil.frp.Frp.Direction_.UP);
    for (idx in newVisited) {
        b = newVisited[idx];
        if (!oldVisited[b.seqStr_]) {
            if (b.addRef(this, count)) {
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

    this.ensureProvidersBefore_(dependant, []);
    dependant.quickLoopCheck_();
};

/**
 * make sure that all providers and providers of those providers have a lower
 * sequence number than b, this will also re-queue and update the dependancy map
 * of all providers that have changed
 *
 * @private
 * @param {recoil.frp.Behaviour} b
 * @param {Object<string,boolean>} visited already visited node to protect from loops
 **/
recoil.frp.TransactionManager.prototype.ensureProvidersBefore_ = function(b, visited) {
    var curSeq = b.seq_;
    if (visited[b.seqStr_]) {
        return;
    }

    visited[b.seqStr_] = true;

    for (var i = 0; i < b.providers_.length; i++) {
        var p = b.providers_[i];

        if (recoil.frp.Frp.compareSeq_(b.seq_, p.seq_) < 0) {
            // not consistent renumber the provider
            visited[p.seqStr_] = true;
            this.changeSequence_(b, p);
            this.ensureProvidersBefore_(p, visited);
        }
    }
};

/**
 * changes the sequence number provider to be less than the sequence number of b
 * @private
 * @param {recoil.frp.Behaviour} b
 * @param {recoil.frp.Behaviour} provider
 */
recoil.frp.TransactionManager.prototype.changeSequence_ = function(b, provider) {
    var newSeq;
    var me = this;
    this.nestIds(b, function() {
        newSeq = me.nextIndex();
    });

    var oldSeqStr = provider.seqStr_;
    var oldSeq = provider.seq_;

    var up = this.getPending_(recoil.frp.Frp.Direction_.UP);
    var down = this.getPending_(recoil.frp.Frp.Direction_.DOWN);

    // remove this provider if it has pending changes because they will be out of order

    var hadUp = up.remove(provider);
    var hadDown = down.remove(provider);

    // change the provider
    provider.seq_ = newSeq;
    provider.seqStr_ = String(newSeq).toString();

    // update the dependancy map
    var oldEntry = this.dependancyMap_[oldSeqStr];
    if (oldEntry) {
        delete this.dependancyMap_[oldSeqStr];
        this.dependancyMap_[provider.seqStr_] = oldEntry;
    }

    // put pending changes back with new sequence number
    if (hadUp) {
        up.push(provider);
    }
    if (hadDown) {
        down.push(provider);
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
 * @param {!recoil.frp.Behaviour<T>} behaviour
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
    console.log('Detach Watching = ', this.watching_);
};
