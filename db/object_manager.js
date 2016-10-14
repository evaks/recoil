goog.provide('recoil.db.Entity');
goog.provide('recoil.db.ObjectManager');


goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Type');
goog.require('recoil.frp.Behaviour');


/**
 * @template T
 * @constructor
 * @param {?} key
 * @param {recoil.frp.Behaviour<T>} value
 */
recoil.db.Entity = function (key, value) {

    this.key_ = key;
    this.value_ = value;
    this.refs_ = 0;
};


/**
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.db.Entity.prototype.behaviour = function () {
    return this.value_;
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
 *
 * @return {!Array<!recoil.util.Pair<!recoil.db.Type, !recoil.frp.Behaviour>} 
 */

recoil.db.ObjectManager.prototype.getRelatedBehaviours = function (keyType, value, behaviour, opt_options) {
    var res = [];
    var me = this;
    for (var i = 0; i < keyType.getPaths(); i++) {
        var path = keyType.getSubKeys();

        path.forEach(value, function (val) {
            
            res.push(
                new recoil.util.Pair(
                    path, me.register(path, val, opt_options)));
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
 * @param {!recoil.frp.Behaviour<T>} value
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.db.ObjectManager.prototype.register = function (typeKey, key, opt_options, coms) {
    var frp = this.frp_;
    var behaviours = recoil.util.map.safeGet(this.queries_,typeKey, new goog.structs.AvlTree(recoil.db.Query.comparator_));

    var behaviour = this.frp_.createNotReadyB();
    
    var me = this;
    // TODO get the sub items for this behaviour, it is not our job to set, create, or delete our children that is the coms layers
    // (maybe) responsiblity all we do calculate our data from our children

    var resultBB = frp.liftB(
        function (v) {
            var related = me.getRelatedBehaviours(typeKey, v, behaviour, opt_options);

            var providers = [];
            for (var i = 0 ; i < related.length; i++) {
                providers.push(related[i].y);
            }

            
            var res = v;
            //TODO cache the result here if all the related behaviours are the same no
            // need to redo this or return a new behaviour

            return frp.liftBI.apply(frp, [
                function () {
                    var res = goog.object.clone(behaviour.get());
                    var curPath = undefined;

                    for (var i = 0; i < related.length; i++) {
                        var newPath = related[i].x;
                        if (newPath !== curPath) {
                            // clear any array or map for that path so we can start adding
                            newPath.reset(res);
                        }
                        // Errors, should be ok since liftBI should propergate
                        newPath.put(res, related.y.get());
                    }
                    
                },
                function (v) {
                    behaviour.set(v);
                    // TODO do we set our subobjects too, no need to send them
                    // since it is the databases responsiblity to do that
                    coms.set(v.getSending(), v.getStored(),
                             function (v) {
                                 frp.accessTrans( function () {
                                     behaviour.set(new recoil.db.SendInfo(v));
                                 }, behaviour);
                             },
                             function (status) {
                                 frp.accessTrans( function () {
                                     
                                     behaviour.metaSet(v);
                                 }, behaviour);
                             },
                             typeKey,key, opt_options);
                    
                }, behaviour].concat(providers));
                
        }, behaviour);
    
    var inversableB = frp.switchB(resultBB);
    
    var entity = new recoil.db.Entity(key, inversableB);

    var oldEntity = behaviours.findFirst(entity);


    if (oldEntity) {
        oldEntity.addRef();
        return oldEntity.behaviour();
    }
    entity.addRef();
    behaviours.add(entity);


    coms.get(
        function (val) {
            frp.accessTrans(function () {
                var oldVal = behaviour.metaGet();

                if (oldVal.good()) {
                    behaviour.set(oldVal.setRead(val));
                }
                else {
                    behaviour.set(new recoil.db.SendInfo(val));
                }
            }, behaviour);
        }, function() {
            frp.accessTrans(function (val) {
                behaviour.metaSet(val);
            }, behaviour);

        }, typeKey, key, opt_options);

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
 * @param {T} topLevel 
 * @param {!Array<recoil.db.ObjectManager.PartInfo} parts
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

recoil.db.ObjectManager.prototype.registerQuery = function (typeKey, query, opt_options, coms) {
    var queries =  recoil.util.map.safeGet(this.queries_,typeKey, new goog.structs.AvlTree(recoil.db.ObjectManager.comparator_));
    var frp = this.frp_;
    var entry = new recoil.db.QueryEntry(query);

    var oldEntry = queries.findFirst(entry);

    if (oldEntry) {
        oldEntry.addRef();
        return oldEntry.behaviour();
    }

    entry.addRef();
    queries.add(entry);

    // this is a list of all the behaviours
    var allObjectsB = recoil.util.map.safeGet(this.objectTypes_,typeKey, new goog.structs.AvlTree(recoil.db.Entity.comparator_));

    var behaviourBB = this.frp_.createNotReadyB();
    var behaviour = frp.switchB(behaviourBB);

    coms.getList(
        function (values) {
            frp.accessTrans(function () {
                // get the
                var oldVal = behaviour.metaGet();

                if (oldVal.good()) {
                    // add all the behaviours that don't exist  to all objects


                    // we are trying to construct a list of entities
                    for (var i = 0; i < values.length; i++) {
                        // if the new value exist old value set the value

                        // if the new value doesn't exist create it and add the reference
                    }

                    for (i = 0; i < oldVal.getRead(); i++) {
                        var val = oldVal.getRead()[i];

                        // if the old value does not exist remove the reference
                    }

                    behaviourBB.set(createList(allEntities));
                    // construct a behaviour that references all the entities
                }
                else {
                    behaviour.set(new recoil.db.SendInfo(val));
                }
            }, behaviour);
        }, function() {
            frp.accessTrans(function (val) {
                behaviour.metaSet(val);
            }, behaviour);

        }, typeKey, opt_options);

    return behaviour;

};


 /**
  * create a behaviour given a list of behaviours
  * @param {!Array<recoil.frp.Behaviour>} list
  * @param {!recoil.frp.Behaviour<goog.structs.AvlTree>} addedB
  */
createListB = function (frp, list, addedB, removeB, orderB) {
    var orderB = frp.createB([]);
    var addedB = frp.createB();
    var removedB = frp.createB();
    // just use added and removed to deal with this the implementation
    // of these will have to go outside the frp engine
    var calc = function() {
            var res = [];
            var seen = new goog.structs.AvlTree(xxx);

            for (var i = 0; i < orderB.get().length; i++) {
                var orderInfo = orderB.get()[i];
                if (orderInfo.src !== undefined) {
                    res.push(list[orderInfo.src].get());
                }
                else {
                    res.push(list[orderInfo.src].get());
                }
            }

            for (var i = 0; i < list.length; i++) {
                res.push(list[i].get());
            }
            return res;
    };

    var inv = function (val) {
    };
    var args = [calc, inv, addedB, removedB].concat(list);

    return frp.liftBI.apply (frp, args);

};

recoil.db.ObjectManager.prototype.unregisterQuery = function (typeKey, query) {
    throw 'not implemented yet';

};


recoil.db.ObjectManager.prototype.dataRecieved = function (typeKey, value) {

};
