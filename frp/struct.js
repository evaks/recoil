goog.provide('recoil.frp.struct');

goog.require('goog.object');
goog.require('recoil.frp.Frp');
goog.require('recoil.frp.Behaviour');

/**
 * @param {string} name the attribute name of the element to get out of the struct
 * @template T
 * @param {recoil.frp.Behaviour} value the structure to get it out of
 * @param {T} opt_default
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.struct.get = function(name, value, opt_default) {
    return value.frp().liftBI(function() {
        var res = value.get()[name];
        if (res === undefined) {
            res = opt_default;
        }
        return res;

    }, function(newVal) {
        var res = goog.object.clone(value.get());
        res[name] = newVal;
        value.set(res);
    }, value);
}
