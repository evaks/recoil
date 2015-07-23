goog.provide('recoil.frp.util');

goog.require('recoil.frp.Behaviour');

recoil.util.toBehaviour = function(frp, value) {

    if (value instanceof recoil.frp.Behaviour) {
        return value;
    }
    else {
        return frp.createConstB(value);
    }
};
/**
 * if value is undefined returns behaviour with def
 * 
 * @template T
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {recoil.frp.Behaviour<T>|T} value
 * @param {recoil.frp.Behaviour<T>|T} def
 * @return {recoil.frp.Behaviour<T>} 
 */
recoil.util.getDefault = function(frp, value, def) {
    value = recoil.util.toBehaviour(frp, value);
    def = recoil.util.toBehaviour(frp, def);
    
    return frp.liftBI(function() {
        if (value.get() === undefined) {
            return def.get();
        }
    }, function(v) {
        value.set(v);
    }, value, def);
    
};
