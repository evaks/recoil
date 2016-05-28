goog.provide('recoil.db.Entity');
goog.provide('recoil.db.ObjectManager');


goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Type');
goog.require('recoil.frp.Behaviour');


/**
 * @template T
 * @constructor
 * @param {?} key
 * @param {T} value
 */
recoil.db.Entity = function (key, value) {
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
    this.frp_ = frp;
};

recoil.db.ObjectManager.XXX = function () {
    this.ids_ = null;
    this.queries_ = null;
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
    
    var behaviours = recoil.util.safeGet(this.objectTypes_,typeKey, new goog.structs.AvlTree());
    var entity = new recoil.db.Entity(key, undefined);

    var oldEntity = behaviours.findFirst(entity);


    if (oldEntity) {
        oldEntity.addRef();
        return oldEntity.behaviour();
    }
    behaviours.add(entity);
    var behaviour = entity.behaviour();
    var frp = this.frp_;

    coms.get(
        function (val) {
            frp.accessTrans(function () {
                var oldVal = behaviour.metaGet();
 
                if (oldVal.isGood()) {
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
            
        }, typeKey, opt_options);

    return behaviour;
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
    
};

recoil.db.ObjectManager.prototype.unregisterQuery = function (typeKey, query) {
    
};


recoil.db.ObjectManager.prototype.dataRecieved = function (typeKey, value) {

};

