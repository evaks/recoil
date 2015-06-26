goog.provide('recoil.frp.struct');

goog.require('goog.object');
goog.require('recoil.frp.Frp');
goog.require('recoil.frp.Behaviour');

/**
 * @param {string} name the attribute name of the element to get out of the struct
 * @template T
 * @param {recoil.frp.Behaviour} value the structure to get it out of
 * @param {T=} opt_default
 * @return {!recoil.frp.Behaviour<T>}
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
};
/**
 * takes object with the fields being behaviours and converts them into an behaviour with objects in them note: fields
 * that are not behaviours will be lost
 * 
 */

recoil.frp.struct.create = function(frp, struct) {
    var args = [];

    // calculate function
    args.push(function() {
        var res = {};
        goog.object.forEach(struct, function(obj, key) {
            if (obj instanceof recoil.frp.Behaviour) {
                res[key] = obj.get();
            }
            else {
                // if it is not a behaviour just return it it means we can add constant
                // fields
                res[key] = obj;
            }

        });
        return res;
    });

    // inverse function
    args.push(function(val) {
        goog.object.forEach(struct, function(obj, key) {
            if (obj instanceof recoil.frp.Behaviour) {
                obj.set(val[key]);
            }
            // if not a behaviour it is not inversable

        });
    });
    
    goog.object.forEach(struct, function(obj) {
        if (obj instanceof recoil.frp.Behaviour) {
            args.push(obj);
        }
    });
    return frp.liftBI.apply(frp, args);

};
