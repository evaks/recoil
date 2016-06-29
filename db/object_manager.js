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
 * @param {recoil.db.Query} query
 */
recoil.db.QueryEntry = function (query) {
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
    var behaviours = recoil.util.map.safeGet(this.objectTypes_,typeKey, new goog.structs.AvlTree(recoil.db.Entity.comparator_));
    var behaviour = this.frp_.createNotReadyB();


    var inversableB = frp.liftBI(
        function (v) {return v;},
        function (v, b) {
            b.set(v);
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
        },behaviour);
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
    var behaviourBB = this.frp_.createNotReadyB();
    var behaviour = frp.switchB(behaviourBB);

    coms.getList(
        function (values) {
            frp.accessTrans(function () {
                // get the 
                var oldVal = behaviour.metaGet();
 
                if (oldVal.good()) {
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

