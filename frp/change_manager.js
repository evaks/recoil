goog.provide('recoil.frp.ChangeManager');

goog.require('recoil.frp.Frp');

/**
 * a change manager action
 * @enum {Object}
 */

recoil.frp.ChangeManager.Action = {
    FLUSH: new Object(),
    CLEAR: new Object()
};


/**
 * creates a behaviour whos changes are stored in changeB until a flushB is sent, at which
 * point valueB gets set and changeB gets put to not Ready
 *
 * @template T
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<T>} valueB
 * @param {!recoil.frp.Behaviour<T>} changeB
 * @param {!recoil.frp.Behaviour<recoil.frp.ChangeManager.Action>} flushE
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.ChangeManager.create = function(frp, valueB, changeB, flushE) {
    return frp.metaLiftBI(
        function(value, change, flush) {
            for (var i = 0; i < flush.get().length; i++) {
                if (changeB.metaGet().ready()) {
                    if (flush.get()[i] === recoil.frp.ChangeManager.Action.FLUSH) {
                        valueB.set(changeB.get());
                        changeB.metaSet(recoil.frp.BStatus.notReady());
                    }
                    else if (flush.get()[i] === recoil.frp.ChangeManager.Action.CLEAR) {
                        changeB.metaSet(recoil.frp.BStatus.notReady());
                    }
                }
            }
            if (changeB.metaGet().ready()) {
                return change;
            }
            return valueB.metaGet();
        },
        function(newValue, valueB, changeB) {
            if (recoil.util.isEqual(newValue, valueB.metaGet())) {
                changeB.metaSet(recoil.frp.BStatus.notReady());
            }
            else {
                changeB.metaSet(newValue);
            }
        }, valueB, changeB, flushE);
};
