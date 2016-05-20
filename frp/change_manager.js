goog.provide('recoil.frp.ChangeManager');

goog.require ('recoil.frp.Frp');

recoil.frp.ChangeManager.FLUSH = new Object();
recoil.frp.ChangeManager.CLEAR = new Object();

recoil.frp.ChangeManager.create = function (frp, valueB, changeB, flushE) {
    return frp.metaLiftBI(
        function (value, change, flush) {
            for (var i = 0; i < flush.get().length; i++) {
                if (changeB.metaGet().ready()) {
                    if (flush.get()[i] === recoil.frp.ChangeManager.FLUSH) {
                        valueB.set(changeB.get());
                        changeB.metaSet(recoil.frp.BStatus.notReady());
                    }
                    else if (flush.get()[i] === recoil.frp.ChangeManager.CLEAR) {
                        changeB.metaSet(recoil.frp.BStatus.notReady());
                    }
                }
            }
            if (changeB.metaGet().ready()) {
                return change;
            }
            return valueB.metaGet();
        },
        function (newValue, valueB, changeB) {
            if (recoil.util.isEqual(newValue, valueB.metaGet())) {
                changeB.metaSet(recoil.frp.BStatus.notReady());
            }
            else {
                changeB.metaSet(newValue);
            }
        }, valueB, changeB, flushE);
};
