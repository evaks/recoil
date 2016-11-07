/**
 * the job of the object manager is to handle objects inside objects
 * and ensure that the get updated correctly
 */
goog.provide('recoil.db.Entity');
goog.provide('recoil.db.ObjectManager');


goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Type');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.structs.Pair');

/**
 * @template T
 * @constructor
 * @param {?} key
 * @param {recoil.frp.Behaviour<T>} value
 * @param {boolean} owned
 */
recoil.db.Entity = function (key, value, owned) {

    this.key_ = key;
    this.value_ = value;
    this.refs_ = 0;
    this.owners_ =  owned ? 1 : 0;
};


/**
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.db.Entity.prototype.behaviour = function () {
    return this.value_;
};

recoil.db.Entity.prototype.setBehaviour_ = function (value) {
    this.value_ = value;
};
recoil.db.Entity.prototype.addOwner = function () {
    this.owners_++;
};
recoil.db.Entity.prototype.removeOwner = function (value) {
    this.owners_--;
};

/**
 * should this entity access the database directly or is it being done by
 * another object
 */
recoil.db.Entity.prototype.accessDb = function () {
    return this.owners_ === 0;
};

/**
 * @return {boolean} true if the ref count was 0
 */
recoil.db.Entity.prototype.addRef = function () {
    this.refs_++;
    return this.refs_ === 0;
};

/**
 * @return {boolean} true if the ref count became 0
 */
recoil.db.Entity.prototype.removeRef = function () {
    this.refs_--;
    return this.refs_ === 0;
};



/**
 * @param {!recoil.db.Entity} x
 * @param {!recoil.db.Entity} y
 * @return {number}
 */
recoil.db.Entity.comparator_ = function (x, y) {
    return recoil.util.compare(x.key_, y.key_);
};

/**
 * @constructor
 * @template T
 * @param {T?} entity
 * @param {recoil.db.Query<T>?} query
 * takes either a query or an entity (really an entity is a query that only ever
 * returns one item
 */
recoil.db.QueryEntry = function (entity, query) {
    this.query_ = query;
    this.entities_ = new goog.structs.AvlTree(recoil.db.Entity.compare);
    this.refs_ = 0;
};


/**
 * @return {boolean} true if the ref count was 0
 */
recoil.db.QueryEntry.prototype.addRef = function () {
    this.refs_++;
    return this.refs_ === 0;
};

/**
 * @return {boolean} true if the ref count became 0
 */
recoil.db.QueryEntry.prototype.removeRef = function () {
    this.refs_--;
    return this.refs_ === 0;
};

/**
 * @param {!recoil.db.QueryEntry} x
 * @param {!recoil.db.QueryEntry} y
 * @return {number}
 */

recoil.db.QueryEntry.comparator_ = function (x, y) {
    return recoil.util.compare(x.query_, y.query_);
};
/**
 * data that represents the current value read from
 * the database and any information that was sent
 * @constructor
 * @template T
 * @param {T} value the value read from the database
 */
recoil.db.SendInfo = function (value) {
    this.value_ = value;
    /**
     * @type {T}
     */
    this.sending_ = null;
};

/**
 * @return {T} maybe null if not sending anything
 */
recoil.db.SendInfo.prototype.getSending = function () {
    return this.sending_;
};


/**
 * @param {T} value
 * @return {!recoil.db.SendInfo<T>}
 */
recoil.db.SendInfo.prototype.setSending = function (value) {
    var res = new recoil.db.SendInfo(this.value_);
    res.sending_ = value;
    return res;
};

/**
 * @return {T}
 */
recoil.db.SendInfo.prototype.getStored = function () {
    return this.value_;
};

/**
 * This helps keep track of all the objects in the system, and ensures that they are the same
 * each object is actually an entity with a unique id that does not change
 * @constructor
 * @param {recoil.frp.Frp} frp
 */
recoil.db.ObjectManager = function (frp) {
    /**
     * @type Object<!recoil.db.Type,goog.structs.AvlTree<!recoil.db.Entity>>
     */
    this.objectTypes_ = {};
    this.queries_ = {};
    this.frp_ = frp;
};


/**
 * based on the key type get all behaviours that are inside 
 * @private
 * @return {!Array<!Object>} each object contains a path, behaviour, key, parentKey 
 */

recoil.db.ObjectManager.prototype.getRelatedBehaviours_ = function (keyType, value, behaviour, opt_options, coms, doRegister) {
    var res = [];
    var me = this;
    for (var i = 0; i < keyType.getPaths().length; i++) {
        var path = keyType.getPaths()[i];
        
        path.forEach(value, function (parentKey, key, val) {
            var b;
            var behaviours = recoil.util.map.safeGet(me.queries_,path.getType().uniqueId(), new goog.structs.AvlTree(recoil.db.Entity.comparator_));
            if (doRegister) {
                b = me.register_(path.getType(), key, opt_options, coms, val);
            }
            else {
                b = behaviours.findFirst(new recoil.db.Entity(key, undefined, false));
            }
            if (b) {
                res.push(
                    {
                        key : key,
                        parentKey : parentKey,
                        path : path,
                        behaviour :  me.register_(path.getType(), key, opt_options, coms, val)
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
 * @param {*} options
 * @param {!recoil.db.DatabaseComms} coms
 * @return {!recoil.frp.Behaviour<T>}
 */

recoil.db.ObjectManager.prototype.register = function (typeKey, key, options, coms) {
    return this.register_(typeKey, key, options, coms);
};

/**
 * updates the outer object with all the sub objects, 
 *
 * @param {*} outer the object to be updated
 * @param {!Array<!Object>} a list of paths and behaviours that are subobjects of
 * @param {bool} is the outer object stored value, or the sending value
 */
recoil.db.ObjectManager.updateWithSubObjects_ = function (outer, related, stored) {
    var prev = undefined;
    for (var i = 0; i < related.length; i++) {
        var cur = related[i];
        if (prev === undefined || prev.path !== cur.path || !recoil.util.object.isEqual(cur.parentKey, prev.parentKey)) {
            // clear any array or map for that path so we can start adding
            console.log("reseting", i, outer);
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
 * @param {!Array<!Object>} related a list of paths and behaviours for the sub object
 * @param {recoil.frp.Frp} frp if specified will use this to create the transaction to set the behavior
 */
recoil.db.ObjectManager.setSubObjects_ = function (val, related, frp) {
    for (var i = 0; i < related.length; i++) {
        var cur = related[i];
        var subVal;
        if (frp) {
            subVal = cur.path.get(cur.parentKey, val, cur.key);
            frp.accessTrans(function () {
                cur.behaviour.set(new recoil.db.SendInfo(subVal));
            }, cur.behaviour);
        }
        else {
            subVal = cur.path.get(cur.parentKey, val.getSending(), cur.key);

            console.log("setting value", cur.key, subVal, val);
            
            if (subVal === recoil.db.error.NOT_PRESENT) {
                cur.behaviour.metaSet(recoil.frp.BStatus.errors([subVal]));
            }
            else {
                var info = cur.behaviour.get().setSending(subVal);
                cur.behaviour.set(info);
            }
        }
    }
};

recoil.db.ObjectManager.prototype.register_ = function (typeKey, key, options, coms, opt_val) {

//    console.log("registering", typeKey, key);
    var frp = this.frp_;
    var behaviours = recoil.util.map.safeGet(this.queries_,typeKey.uniqueId(), new goog.structs.AvlTree(recoil.db.Entity.comparator_));

    var hasVal = arguments.length > 4;
    
    var behaviour =  this.frp_.createNotReadyB();

    var entity = new recoil.db.Entity(key, undefined, hasVal);
    var oldEntity = behaviours.findFirst(entity);

    if (oldEntity) {
        if (hasVal) {
            oldEntity.addOwner();
        }
        oldEntity.addRef();
        return oldEntity.behaviour();
    }
    
    var me = this;
    // TODO get the sub items for this behaviour, it is not our job to set, create, or delete our children that is the coms layers
    // (maybe) responsiblity all we do calculate our data from our children

    var resultBB = frp.liftB(
        function (v) {
            var relatedStored = me.getRelatedBehaviours_(typeKey, v.getStored(), behaviour, options, coms, true);
            var relatedSending = me.getRelatedBehaviours_(typeKey, v.getSending(), behaviour, options, coms, true);

            var providers = [];
            for (var i = 0 ; i < relatedStored.length; i++) {
                providers.push(relatedStored[i].behaviour);
            }
            for (i = 0 ; i < relatedSending.length; i++) {
                providers.push(relatedSending[i].behaviour);
            }

            
            var res = v;
            //TODO cache the result here if all the related behaviours are the same no
            // need to redo this or return a new behaviour, we also need to deregister the related behaviours if we do so

            return frp.metaLiftBI.apply(frp, [
                function () {
                    var metaRes = frp.mergeErrors(arguments);
                    if (!metaRes.good()) {
                        return metaRes;
                    }
                    // the related maybe out of date by now, they only change when the behaviours change
                    var res = recoil.util.object.clone(behaviour.get());
                    if (res === undefined) {
                        console.log("undef",res);
                    }
                    recoil.db.ObjectManager
                        .updateWithSubObjects_(res.getStored(),relatedStored, true);
                    recoil.db.ObjectManager
                        .updateWithSubObjects_(res.getSending(),relatedSending, false);
                    return metaRes.set(res);
                    
                },
                function (metaV) {
                    if (!metaV.good()) {
                        console.log("setting un", metaV, behaviour.metaGet());
                        behaviour.metaSet(metaV);
                        return;
                    }
                    var v = metaV.get();
                    behaviour.set(v);
                    recoil.db.ObjectManager.setSubObjects_(v, relatedStored);

                    if (entity.accessDb()) {
                        // TODO do we set our subobjects too, no need to send them
                        // since it is the databases responsiblity to do that
                        coms.set(v.getSending(), v.getStored(),
                                 function (v) {
                                     frp.accessTrans( function () {
                                         behaviour.set(new recoil.db.SendInfo(v));
                                         // don't register, if they are already registered get the
                                         // otherwize just ignore them MAYBE
                                         var relatedStored = me.getRelatedBehaviours_(typeKey, v, behaviour, options, coms, false);
                                         
                                         recoil.db.ObjectManager
                                             .setSubObjects_(v,relatedStored, frp);

                                         
                                     }, behaviour);
                                 },
                                 function (status) {
                                     frp.accessTrans( function () {
                                         behaviour.metaSet(v);
                                     }, behaviour);
                                 },
                                 typeKey,key, options);
                    }
                        
                }, behaviour].concat(providers));
                
        }, behaviour);
    
    var inversableB = frp.switchB(resultBB);
    entity.setBehaviour_(inversableB);



    entity.addRef();
    behaviours.add(entity);


    if (hasVal) {
        frp.accessTrans(
            function () {
                var oldVal = behaviour.metaGet();
                
                if (oldVal.good()) {
                    behaviour.set(oldVal.setRead(opt_val));
                }
                else{ 
                    behaviour.set(new recoil.db.SendInfo(opt_val));
                }
                
            }, behaviour);
    }
    else {
        coms.get(
            function (val) {
                frp.accessTrans(function () {
                    var oldVal = behaviour.metaGet();
                    
                    if (oldVal.good()) {
                        behaviour.set(oldVal.setRead(val));
                    }
                    else{ 
                        behaviour.set(new recoil.db.SendInfo(val));
                    }
                    
                }, behaviour);
            }, function() {
                frp.accessTrans(function (val) {
                    behaviour.metaSet(val);
                }, behaviour);
                
            }, typeKey, key, options);
    }

       
    return inversableB;
};
/**
 * takes an object and breaks it down into its component objects and returns a behaviour
 * this is used to get the object, if the object already exists it uses that instead
 *
 * @template T
 * @param {!recoil.db.Type<T>} typeKey 
 * @param {T} object 
 * @return {recoil.frp.Behaviour<T>} a list of entities
 */ 
recoil.db.ObjectManager.prototype.disassemble = function (typeKey, object) {
    var subObjects = typeKey.subObjects();
    var parts = [];
    var me = this;
    
    subObjects.forEach(function (path) {
        var subs = path.getAll(object);
        for (var i = 0; i < subs.list.length;  i++) {
            var subB = me.registerData(path.keyType(), subs.list[i].value);
            parts.push({path: subs.list[i].path, behaviour: subB});
        }
    });

    return this.createFromParts_(object, parts); 
};

/**
 * makes a behaviour out a to level objects and sub parts
 * 
 * this is an inversable behaviour so setting it will work
 * @template T
 * @param {T} topLevel 
 * @param {!Array<recoil.db.ObjectManager.PartInfo>} parts
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.db.ObjectManager.prototype.createParts_ = function (topLevel, parts) {
    var params = [
        function (main) {
            main = goog.object.clone(main);
            for (var i = 0; i < parts.length; i++) {
                var value = arguments[i+1];
               
                parts[i].path.put(main, value);
            }
            return main;
        },
            function (value) {
                value = goog.object.clone(value);
                for (var i = 0; i < parts.length; i++) {
                    var subValue = parts[i].path.get(value);
                    parts[i].path.clear(value);
                    arguments[i+1].set(subValue);
                }
            }
    ];
    
    params.push(this.frp_.createB(topLevel));
    parts.forEach(function (part) {
        params.push(part.behaviour);
    });

    this.frp_.liftBI.apply(this.frp_, params);

};
recoil.db.ObjectManager.prototype.unregister = function (typeKey, key, opt_options, coms) {
    var behaviours = this.objectTypes_[typeKey];
    if (behaviours === undefined) {
        return;
    }

    var entity = new recoil.db.Entity(key, undefined);

    var oldEntity = behaviours.findFirst(entity);

    if (!oldEntity) {
        return;
    }
    if (oldEntity.removeRef()) {
        behaviours.remove(oldEntity);
        if (behaviours.size() === 0) {
            delete this.objectTypes_[typeKey];
        }
    }

};

recoil.db.ObjectManager.prototype.unregisterQuery = function (typeKey, query) {
    throw 'not implemented yet';

};


recoil.db.ObjectManager.prototype.dataRecieved = function (typeKey, value) {

};
