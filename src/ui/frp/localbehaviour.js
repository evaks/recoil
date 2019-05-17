goog.provide('recoil.ui.frp.LocalBehaviour');

goog.require('goog.object');
goog.require('recoil.db.Cache');
goog.require('recoil.frp.util');
goog.require('recoil.ui.message');
goog.require('recoil.ui.message.MessageEnum');


/**
 * @constructor
 * @param {!recoil.frp.Frp} frp
 * @param {!string} version use this old values are lost if you upgrade
 * @param {!string} key the key to store this var under
 * @param {?} defVal
 * @param {?} storage
 * @param {!recoil.db.Cache.Serializer=} opt_serializer
 * @return {!recoil.frp.Behaviour}
 */
recoil.ui.frp.LocalBehaviour.create = function(frp, version, key, defVal, storage,  opt_serializer) {
    var k = 'recoil.ui.frp.store' + version + ':' + key;
    var res = recoil.ui.frp.LocalBehaviour.items_[k];
    var serializer = opt_serializer || new recoil.db.Cache.DefaultSerializer();
    if (res) {
        return res;
    }
    var storeB = /** @type {!recoil.frp.Behaviour} **/(frp.createB(null));
    res = frp.liftBI(
        function() {
            if (storage.hasOwnProperty(k)) {
                return serializer.deserialize(storage[k]);
            }
            return defVal;
        }, function(val) {
            var sval = serializer.serialize(val);
            storage.setItem(k, sval);
            storeB.set(sval);
        }, storeB);
    recoil.ui.frp.LocalBehaviour.items_[k] = res;
    return res;
};

/**
 * @private
 */
recoil.ui.frp.LocalBehaviour.items_ = {};

/**
 * creates a local storage, this is persisted even when browser is closed
 *
 * @suppress {undefinedVars}
 * @param {!recoil.frp.Frp} frp
 * @param {!string} version use this old values are lost if you upgrade
 * @param {!string} key the key to store this var under
 * @param {?} defVal
 * @param {!recoil.db.Cache.Serializer=} opt_serializer
 * @return {!recoil.frp.Behaviour}
 */

recoil.ui.frp.LocalBehaviour.createLocal = function(frp, version, key, defVal, opt_serializer) {
    return recoil.ui.frp.LocalBehaviour.create(frp, version, key, defVal, localStorage, opt_serializer);
};
/**
 * creates a session storage
 * @suppress {undefinedVars}
 * @param {!recoil.frp.Frp} frp
 * @param {!string} version use this old values are lost if you upgrade
 * @param {!string} key the key to store this var under
 * @param {?} defVal
 * @param {!recoil.db.Cache.Serializer=} opt_serializer
 * @return {!recoil.frp.Behaviour}
 */
recoil.ui.frp.LocalBehaviour.createSession = function(frp, version, key, defVal, opt_serializer) {
    return recoil.ui.frp.LocalBehaviour.create(frp, version, key, defVal, sessionStorage, opt_serializer);
};

/**
 * creates a local session storage, this will use both session
 * local, session will override the local storage, but will write to both
 * this write to both, this is useful if you want to new tabs have information
 * of the old tab when opened but maintain its new copy
 *
 * @suppress {undefinedVars}
 * @param {!recoil.frp.Frp} frp
 * @param {!string} version use this old values are lost if you upgrade
 * @param {!string} key the key to store this var under
 * @param {?} defVal
 * @param {!recoil.db.Cache.Serializer=} opt_serializer
 * @return {!recoil.frp.Behaviour}
 */
recoil.ui.frp.LocalBehaviour.createSessionLocal = function(frp, version, key, defVal, opt_serializer) {
    var def = new Object();
    var sessionB = recoil.ui.frp.LocalBehaviour.create(frp, version, 'session.' + key, def, sessionStorage, opt_serializer);
    var localB = recoil.ui.frp.LocalBehaviour.create(frp, version, 'local.' + key, def, localStorage, opt_serializer);


    return frp.liftBI(function(l, s) {
       var val = s === def ? l : s;
       return val === def ? defVal : val;
    }, function(v) {
        localB.set(v);
        sessionB.set(v);
    }, localB, sessionB);
};

/**
 * clears all local storage
 */
recoil.ui.frp.LocalBehaviour.clear = function() {
    console.log('clearing storage');
    localStorage.clear();
    sessionStorage.clear();
};
