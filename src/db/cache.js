goog.provide('recoil.db.Cache');
goog.provide('recoil.db.Cache.Serializer');

goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Database');
goog.require('recoil.db.DatabaseComms');
goog.require('recoil.db.Type');
goog.require('recoil.frp.BStatus');


/**
 * this uses local or session storage to cache values behaviours
 * locally
 *
 * @constructor
 * @suppress {undefinedVars}
 * @param {!string} version use this old values are lost if you upgrade
 * @param {!recoil.db.Cache.Serializer=} opt_serializer
 * @param {!boolean=} opt_local if true uses local storage else session storage
 */
recoil.db.Cache = function(version, opt_serializer, opt_local) {
    this.serializer_ = opt_serializer || new recoil.db.Cache.DefaultSerializer();
    this.storage_ = opt_local ? localStorage : sessionStorage;
};

/**
 * note this will clear all local / session storage according to the
 * type of this cache
 *
 */
recoil.db.Cache.prototype.clear = function() {
    this.storage_.clear();
};
/**
 * @template T
 * @param {!string} key
 * @param {!recoil.frp.Behaviour<T>} sourceB
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.db.Cache.prototype.get = function(key, sourceB) {
    var frp = sourceB.frp();
    var me = this;
    return frp.metaLiftBI(
        function(v) {
            var k = me.version + ':' + key;
            if (v.ready()) {
                if (v.good()) {
                    me.storage_.setItem(k, me.serializer_.serialize(v.get()));
                }
                return v;
            }
            if (me.storage_.hasOwnProperty(k)) {
                return new recoil.frp.BStatus(me.serializer_.deserialize(me.storage_[k]));
            }
            return recoil.frp.BStatus.notReady();
        },
        function(v) {
            if (sourceB.good()) {
                sourceB.set(v.get());
            }
        }, sourceB);
};

/**
 * @interface
 */
recoil.db.Cache.Serializer = function() {};
/**
 * @param {?} val
 * @return {!string}
 */
recoil.db.Cache.Serializer.prototype.serialize = function(val) {};
/**
 * @param {string} val
 * @return {?}
 */
recoil.db.Cache.Serializer.prototype.deserialize = function(val) {};
/**
 * @constructor
 * @implements {recoil.db.Cache.Serializer}
 */
recoil.db.Cache.DefaultSerializer = function() {
};

/**
 * @param {?} val
 * @return {!string}
 */
recoil.db.Cache.DefaultSerializer.prototype.serialize = function(val) {
    return JSON.stringify(val);
};
/**
 * @param {string} val
 * @return {?}
 */

recoil.db.Cache.DefaultSerializer.prototype.deserialize = function(val) {
    return JSON.parse(val);
};
