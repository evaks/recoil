goog.provide('recoil.db.ObjectManager');


goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Type');
goog.require('recoil.frp.Behaviour');


/**
 * This helps keep track of all the objects in the system, and ensures that they are the same
 * each object is actually an entity with a unique id that does not change
 * @constructor
 */
recoil.db.ObjectManager = function () {
    /**
     * @type Object<!recoil.db.Type,goog.structs.AvlTree<!recoil.db.Entity>>
     */
    this.objectTypes_ = {};
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
 * @param {!recoil.frp.Behaviour<T>} value
 * @return {!recoil.frp.Behaviour<T>} 
 */
recoil.db.ObjectManager.prototype.register = function (typeKey, key, opt_options, coms) {
    
    var behaviours = this.objectTypes_[typeKey];
    var entity = new recoil.db.Enitity(key, undefined);

    var oldEntity = behaviours.findFirst(entity);

    if (oldEntity) {
        return oldEntity.behaviour();
    }
    
    var x = this.frp_.liftBI (
        function () {});

    return null;
};

recoil.db.ObjectManager.prototype.unregister = function (typeKey, key, opt_options, coms) {

};

recoil.db.ObjectManager.prototype.registerQuery = function (typeKey, query, opt_options, coms) {
    
};

recoil.db.ObjectManager.prototype.unregisterQuery = function (typeKey, query) {
    
};


recoil.db.ObjectManager.prototype.dataRecieved = function (typeKey, value) {

};
