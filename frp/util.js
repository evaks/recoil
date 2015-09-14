goog.provide('recoil.frp.Util');

goog.require('recoil.frp.Behaviour');

/**
 * @constructor
 * @param {recoil.frp.Frp} frp the frp engine to do operations on
 */
recoil.frp.Util = function (frp) {
    this.frp_ = frp;
} 

/**
 * converts a value to a behaviour, if the value is already a behaviour
 * does nothing
 * @template T
 * @param {recoil.frp.Behaviour<T> | T} value
 * @return {recoil.frp.Behaviour<T>}
 * 
 */
recoil.frp.Util.prototype.toBehaviour = function(value) {

    if (value instanceof recoil.frp.Behaviour) {
        return value;
    }
    else {
        return this.frp_.createConstB(value);
    }
};
/**
 * if value is undefined returns behaviour with def
 * 
 * @template T
 * @param {recoil.frp.Behaviour<T>|T} value
 * @param {recoil.frp.Behaviour<T>|T} def
 * @return {recoil.frp.Behaviour<T>} 
 */
recoil.frp.Util.prototype.getDefault = function(value, def) {
    value = this.toBehaviour(value);
    def = this.toBehaviour(def);
    
    return this.frp_.liftBI(function() {
        if (value.get() === undefined) {
            return def.get();
        }
        return value.get();
    }, function(v) {
        value.set(v);
    }, value, def);
    
};
