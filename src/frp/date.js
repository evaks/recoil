/**
 * provides a set of utilities that give logical operation
 *
 */
goog.provide('recoil.frp.date');

goog.require('goog.date.Date');
goog.require('recoil.frp.util');
goog.require('recoil.util.func');
goog.require('recoil.util.object');



/**
 * date utility functions
 */


/**
 * @param {!recoil.frp.Behaviour<!number>} milli
 * @return {!recoil.frp.Behaviour<!goog.date.Date>}
 */
recoil.frp.date.milliToDate = function(milli) {
    return milli.frp().liftBI(
        function(val) {
            var d = new Date(val);
            return new goog.date.Date(d.getFullYear(), d.getMonth(), d.getDate());
        },
        function(val) {
            milli.set(val.getTime());
        }, milli);
};


