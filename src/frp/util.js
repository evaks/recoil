goog.provide('recoil.frp.Util');

goog.require('recoil.frp.Behaviour');
goog.require('recoil.ui.messages');
goog.require('recoil.util');

/**
 * @constructor
 * @param {recoil.frp.Frp} frp the frp engine to do operations on
 */
recoil.frp.Util = function(frp) {
    this.frp_ = frp;
};

/**
 * converts a value to a behaviour, if the value is already a behaviour
 * does nothing
 * @template T,O
 * @param {recoil.frp.Behaviour<T> | T} value
 * @param {T=} opt_default
 * @return {!recoil.frp.Behaviour<O>}
 *
 */
recoil.frp.Util.prototype.toBehaviour = function(value, opt_default) {

    if (value instanceof recoil.frp.Behaviour) {
        return value;
    }
    else {
        if (opt_default !== undefined && value === undefined) {
            return this.frp_.createConstB(opt_default);
        }
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
/**
 * converts each item into a behaviour if it is not already one
 *
 * @param {!number} start only convert items >= this index
 * @param {Array<recoil.frp.Behaviour|*>|Arguments} items
 * @return {Array<recoil.frp.Behaviour>} items made into behaviours
 */
recoil.frp.Util.prototype.arrayToBehaviours = function(start, items) {
    var res = [];
    for (var i = start; i < items.length; i++) {
        res.push(this.toBehaviour(items[i]));
    }
    return res;
};

/**
 *
 * @param {!number} start only convert items >= this index
 * @param {Array<recoil.frp.Behaviour>} items
 * @return {Array} an array of values stored in the behaviours
 */
recoil.frp.Util.arrayToValues = function(start, items) {
    var res = [];
    for (var i = start; i < items.length; i++) {
        res.push(items[i].get());
    }
    return res;
};

/**
 *
 * @param {...recoil.frp.Behaviour} var_values
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.Util.prototype.isAllGood = function(var_values) {

    var outerArg = arguments;
    return recoil.util.invokeParamsAndArray(this.frp_.metaLiftB, this.frp_, function() {
        for (var i = 0; i < outerArg.length; i++) {
            if (!outerArg[i].metaGet().good()) {
                return new recoil.frp.BStatus(false);
            }
        }
        return new recoil.frp.BStatus(true);
    }, arguments);
};

/**
 *
 * @param {...recoil.frp.Behaviour} var_values
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.frp.Util.prototype.isAllGoodExplain = function(var_values) {

    var outerArg = arguments;
    return recoil.util.invokeParamsAndArray(this.frp_.metaLiftB, this.frp_, function() {
        var result = new recoil.frp.BStatus(false);
        var errors = [];
        var ready = true;

        for (var i = 0; i < outerArg.length; i++) {
            var meta = outerArg[i].metaGet();
            if (!meta.good()) {
                goog.array.extend(errors, meta.errors());
                if (ready && meta.notReady()) {
                    errors.push(recoil.ui.messages.NOT_READY);
                    ready = false;
                }
            }
        }
        if (errors.length == 0) {
            return new recoil.frp.BStatus(recoil.ui.BoolWithExplanation.TRUE);
        }

        return new recoil.ui.BoolWithExplanation(false, recoil.ui.messages.join(errors));

    }, arguments);
};

/*
var x = createB(1);
var y = createB(2);

var z = metaLiftB(function() {return x.get() + y.get()}, x, y);
*/
