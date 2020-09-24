/**
 * the job of the object manager is to handle objects inside objects
 * and ensure that the get updated correctly
 */
goog.provide('recoil.db.Entity');
goog.provide('recoil.db.ObjectManager');
goog.provide('recoil.db.SendInfo');


goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Type');
goog.require('recoil.frp.BStatus');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.structs.Pair');

/**
 * @template T
 * @constructor
 * @param {?} key
 * @param {recoil.frp.Behaviour<T>} value
 * @param {boolean} owned
 */
recoil.db.Entity = function(key, value, owned) {

    this.key_ = key;
    this.value_ = value;
    this.refs_ = 0;
    this.owners_ = owned ? 1 : 0;
};


/**
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.db.Entity.prototype.behaviour = function() {
    return this.value_;
};

/**
 * @private
 * @param {recoil.frp.Behaviour<T>} value
 */
recoil.db.Entity.prototype.setBehaviour_ = function(value) {
    this.value_ = value;
};

/**
 * @return {boolean} true if the ref count was 0
 */
recoil.db.Entity.prototype.addRef = function() {
    this.refs_++;
    return this.refs_ === 0;
};

/**
 * @return {boolean} true if the ref count became 0
 */
recoil.db.Entity.prototype.removeRef = function() {
    this.refs_--;
    return this.refs_ === 0;
};



/**
 * @private
 * @param {!recoil.db.Entity} x
 * @param {!recoil.db.Entity} y
 * @return {number}
 */
recoil.db.Entity.comparator_ = function(x, y) {
    return recoil.util.compare(x.key_, y.key_);
};

/**
 * data that represents the current value read from
 * the database and any information that was sent
 * @constructor
 * @template T
 * @param {T} value the value read from the database
 * @param {boolean} toplevel
 */
recoil.db.SendInfo = function(value, toplevel) {
    this.value_ = value;
    /**
     * @type {T}
     * @private
     */
    this.toplevel_ = toplevel;
    this.sending_ = null;
};

/**
 * @return {T} maybe null if not sending anything
 */
recoil.db.SendInfo.prototype.getSending = function() {
    return this.sending_;
};


/**
 * @param {T} value
 * @param {boolean} toplevel
 * @return {!recoil.db.SendInfo<T>}
 */
recoil.db.SendInfo.prototype.setSending = function(value, toplevel) {
    var res = new recoil.db.SendInfo(this.value_, toplevel);
    res.sending_ = value;
    return res;
};

/**
 * returns if object is a top level object, this is used to determine
 * if we should send the data to the database
 * @return {boolean}
 */
recoil.db.SendInfo.prototype.isToplevel = function() {
    return this.toplevel_;
};
/**
 * @param {T} value
 * @param {boolean} toplevel
 * @return {!recoil.db.SendInfo<T>}
 */
recoil.db.SendInfo.prototype.setRead = function(value, toplevel) {
    var res = new recoil.db.SendInfo(value, toplevel);
    return res;
};

/**
 * @return {T}
 */
recoil.db.SendInfo.prototype.getStored = function() {
    return this.value_;
};

/**
 *
 * @param {!recoil.frp.Frp} frp
 * @private
 * @constructor
 */
recoil.db.TypeBehaviourInfo_ = function(frp) {
    this.behaviours_ = new goog.structs.AvlTree(recoil.db.Entity.comparator_);
    this.createdE_ = frp.createE();
};

/**
 *
 * @return {!goog.structs.AvlTree<!recoil.db.Entity>}
 */
recoil.db.TypeBehaviourInfo_.prototype.getBehaviours = function() {
    return this.behaviours_;
};

/**
 *
 * @return {!recoil.frp.Behaviour}
 */
recoil.db.TypeBehaviourInfo_.prototype.getCreateEvent = function() {
    return this.createdE_;
};

/**
 * This helps keep track of all the objects in the system, and ensures that they are the same
 * each object is actually an entity with a unique id that does not change
 * @constructor
 * @param {!recoil.frp.Frp} frp
 */
recoil.db.ObjectManager = function(frp) {
    /**
     * @type {Object<!recoil.db.Type,goog.structs.AvlTree<!recoil.db.Entity>>}
     * @private
     */
    this.objectTypes_ = {};
    /**
     *
     * @type {IObject<string, recoil.db.TypeBehaviourInfo_>}
     * @private
     */
    this.queries_ = /** @type {IObject<string, recoil.db.TypeBehaviourInfo_>} */ ({});
    this.frp_ = frp;
};

// {avl: new goog.structs.AvlTree(recoil.db.Entity.comparator_), created: created

/**
 * based on the key type get all behaviours that are inside
 * @private
 * @template T
 * @param {!recoil.db.Type<T>} keyType
 * @param {T} value
 * @param {!recoil.frp.Behaviour<T>} behaviour
 * @param {!recoil.db.QueryOptions} options
 * @param {!recoil.db.DatabaseComms} coms
 * @param {boolean} doRegister
 * @return {!IArrayLike<!Object>} each object contains a path, behaviour, key, parentKey
 */

recoil.db.ObjectManager.prototype.getRelatedBehaviours_ = function(keyType, value, behaviour, options, coms, doRegister) {
    var res = [];
    var me = this;
    for (var i = 0; i < keyType.getPaths().length; i++) {
        var path = keyType.getPaths()[i];

        path.forEach(value, function(parentKey, key, val) {
            var b;
            var behaviours = recoil.util.map.safeGet(me.queries_, path.getType().uniqueId(), new recoil.db.TypeBehaviourInfo_(behaviour.frp()));
            if (doRegister) {
                b = me.register_(path.getType(), key, options, coms, val);
            }
            else {
                b = behaviours.getBehaviours().findFirst(new recoil.db.Entity({key: key, options: options}, null, false));
            }
            if (b) {
                res.push(
                    {
                        key: key,
                        parentKey: parentKey,
                        path: path,
                        behaviour: me.register_(path.getType(), key, options, coms, val)
                    });
            }
        });
    }

    return res;
};

/**
 * this is called to say we are interested in a key and about get the data
 * it does
 * @template T
 * @param {!recoil.db.Type<T>} typeKey
 * @param {?} key
 * @param {!recoil.db.QueryOptions} options
 * @param {!recoil.db.DatabaseComms} coms
 * @return {!recoil.frp.Behaviour<T>}
 */

recoil.db.ObjectManager.prototype.register = function(typeKey, key, options, coms) {
    return this.register_(typeKey, key, options, coms);
};

/**
 * updates the outer object with all the sub objects,
 *
 * @private
 * @param {*} outer the object to be updated
 * @param {!IArrayLike<!Object>} related list of paths and behaviours that are subobjects of
 * @param {boolean} stored is the outer object stored value, or the sending value
 */
recoil.db.ObjectManager.updateWithSubObjects_ = function(outer, related, stored) {
    var prev = undefined;
    for (var i = 0; i < related.length; i++) {
        var cur = related[i];
        if (prev === undefined || prev.path !== cur.path || !recoil.util.object.isEqual(cur.parentKey, prev.parentKey)) {
            // clear any array or map for that path so we can start adding
            cur.path.reset(cur.parentKey, outer);
        }
        // Errors, should be ok since liftBI should propergate
        var val = cur.behaviour.get();
        var v = stored ? val.getStored() : val.getSending();
        cur.path.put(cur.parentKey, outer, cur.key, v);
//        console.log("put data", cur.key, recoil.util.object.clone(outer), stored, recoil.util.object.clone(v));
        prev = cur;
    }
};

/**

 * sets the related sub objects base on the outer object
 * @private
 * @param {!Object} outer the outer object to update from
 * @param {!IArrayLike<!Object>} related a list of paths and behaviours for the sub object
 * @param {!recoil.frp.Frp=} opt_frp if specified will use this to create the transaction to set the behavior
 */
recoil.db.ObjectManager.setSubObjects_ = function(outer, related, opt_frp) {
    for (var i = 0; i < related.length; i++) {
        var cur = related[i];
        var subVal;
        if (opt_frp) {
            subVal = cur.path.get(cur.parentKey, outer, cur.key);
            opt_frp.accessTrans(function() {
                cur.behaviour.set(new recoil.db.SendInfo(subVal, false));
            }, cur.behaviour);
        }
        else {
            subVal = cur.path.get(cur.parentKey, outer.getSending(), cur.key);

            if (subVal === recoil.db.error.NOT_PRESENT) {
                cur.behaviour.metaSet(recoil.frp.BStatus.errors([subVal]));
            }
            else {
                var info = cur.behaviour.get().setSending(subVal, false);
                cur.behaviour.set(info);
            }
        }
    }
};

/**
 * @template T
 * @private
 * @param {!recoil.db.Type<T>} typeKey
 * @param {!IArrayLike<?>|!recoil.db.Query} key
 * @param {!recoil.db.QueryOptions} options
 * @param {!recoil.db.DatabaseComms} coms
 * @param {*=} opt_val
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.db.ObjectManager.prototype.register_ = function(typeKey, key, options, coms, opt_val) {

    var frp = this.frp_;
    // var behaviours = recoil.util.map.safeGet(this.queries_, typeKey.uniqueId(), new goog.structs.AvlTree(recoil.db.Entity.comparator_));
    var behaviours = recoil.util.map.safeGet(this.queries_, typeKey.uniqueId(),
            new recoil.db.TypeBehaviourInfo_(frp));


    var hasVal = arguments.length > 4;

    /**
     * @type {!recoil.frp.Behaviour<!recoil.db.SendInfo>}
     */
    var behaviour = this.frp_.createNotReadyB();

    var childAdded = this.frp_.createE();

    var entity = new recoil.db.Entity({key: key, options: options}, null, hasVal);
    var behavioursList = behaviours.getBehaviours();

    var oldEntity = behavioursList.findFirst(entity);

    if (oldEntity) {
        oldEntity.addRef();
        return /** @type {!recoil.frp.Behaviour} */(oldEntity.behaviour());
    }

    var me = this;
    // TODO get the sub items for this behaviour, it is not our job to set, create, or delete our children that is the coms layers
    // (maybe) responsiblity all we do calculate our data from our children

    // we have to use meta lift be here otherwise we will simply return and error here
    // if an error occurs on behaviour, what we want to do is return a behaviour with an error
    // in it, otherwise inverse will not work
    var resultBB = frp.metaLiftB(
        function(metaV) {
            var providers = [];
            var relatedStored = [];
            var relatedSending = [];

            if (metaV.good()) {
                var v = metaV.get();
                // this job of this is to get all the related behaviours and
                // create a behaviour that depends on them
                relatedStored = me.getRelatedBehaviours_(typeKey, v.getStored(), behaviour, options, coms, true);
                relatedSending = me.getRelatedBehaviours_(typeKey, v.getSending(), behaviour, options, coms, true);


                for (var i = 0; i < relatedStored.length; i++) {
                    providers.push(relatedStored[i].behaviour);
                }
                for (i = 0; i < relatedSending.length; i++) {
                    providers.push(relatedSending[i].behaviour);
                }

          }
            //TODO cache the result here if all the related behaviours are the same no
            // need to redo this or return a new behaviour, we also need to deregister the related behaviours if we do so

            return new recoil.frp.BStatus(frp.metaLiftBI.apply(frp, [
                function() {
                    var metaRes = frp.mergeErrors(arguments);
                    if (!metaRes.good()) {
                        return metaRes;
                    }
                    var res = recoil.util.object.clone(behaviour.get());
                    // update the result with all the sub behaviours
                    // the only case in which we we may update children
                    // here is when they have not been registered yet

                    recoil.db.ObjectManager
                        .updateWithSubObjects_(res.getStored(), relatedStored, true);
                    recoil.db.ObjectManager
                        .updateWithSubObjects_(res.getSending(), relatedSending, false);
                    return metaRes.set(res);

                },
                function(metaV) {
                    if (!metaV.good()) {
                        behaviour.metaSet(metaV);
                        // TODO we may need to send the data to the database  if we
                        // are deleting this object
                        return;
                    }

                    // update the +child objects with the new sent data
                    var v = metaV.get();


                    // var creating = v.isToplevel() && v.value_ === null;
                    // if (v.isToplevel() && behaviour.metaGet().errors().contains(notpresnet)) {
                    //     console.log('check which parent has the value I\'m sending', v.sending_);
                    //
                    //     // for each parent that has the value you creating()
                    //     //    updater.set(x);
                    // }


                    behaviour.set(v);
                    recoil.db.ObjectManager.setSubObjects_(v, relatedStored);

                    // only send the information to the database at the top level
                    // it is the database coms layer responsiblity to handle children
                    if (v.isToplevel()) {
                        coms.set(v.getSending(), v.getStored(),
                                 function(v) {
                                     frp.accessTrans(function() {
                                         behaviour.set(new recoil.db.SendInfo(v, false));
                                         // don't register, if they are already registered get the
                                         // otherwize just ignore them MAYBE
                                         var relatedStored = me.getRelatedBehaviours_(typeKey, v, behaviour, options, coms, false);

                                         recoil.db.ObjectManager
                                             .setSubObjects_(v, relatedStored, frp);


                                     }, behaviour);
                                 },
                                 function(status) {
                                     frp.accessTrans(function() {
                                         behaviour.metaSet(v);
                                     }, behaviour);
                                 },
                                 typeKey, key, options);
                    }

                }, behaviour].concat(providers)));

        }, behaviour/*, behavioursList*/);

    var inversableB = frp.switchB(resultBB);
    entity.setBehaviour_(inversableB);

    entity.addRef();
    behavioursList.add(entity);


    if (hasVal) {
        frp.accessTrans(
            function() {
                var oldVal = /** @type {recoil.frp.BStatus<!recoil.db.SendInfo>} */ (behaviour.metaGet());

                if (oldVal.good()) {
                    behaviour.set(oldVal.get().setRead(opt_val, false));
                }
                else {
                    behaviour.set(new recoil.db.SendInfo(opt_val, false));
                }

            }, behaviour);
    }
    else {
        coms.get(
            function(val) {
                frp.accessTrans(function() {
                    var oldVal = behaviour.metaGet();

                    if (oldVal.good()) {
                        behaviour.set(oldVal.get().setRead(val, false));
                    }
                    else {
                        behaviour.set(new recoil.db.SendInfo(val, false));
                    }

                }, behaviour);
            }, function(val) {
                frp.accessTrans(function() {
                    behaviour.metaSet(val);
                }, behaviour);

            }, typeKey, key, options);
    }


    return inversableB;
};

/**
 * called when the object is not longer used
 * @template T
 * @param {!recoil.db.Type<T>} typeKey
 * @param {?} key
 * @param {recoil.db.QueryOptions} options
 * @param {!recoil.db.DatabaseComms} coms
 */
recoil.db.ObjectManager.prototype.unregister = function(typeKey, key, options, coms) {
    var behaviours = this.queries_[typeKey.uniqueId()];
    if (!behaviours) {
        return;
    }

    var entity = new recoil.db.Entity({key: key, options: options}, null, true);
    var behavioursList = behaviours.getBehaviours();
    var oldEntity = behavioursList.findFirst(entity);

   if (oldEntity && oldEntity.removeRef()) {
        coms.stop(typeKey, key, options);
        behavioursList.remove(oldEntity);
        if (behavioursList.getCount() === 0) {
            delete this.queries_[typeKey.uniqueId()];
        }
    }

};

