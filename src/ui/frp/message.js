/**
 * provides a behaviour of a cell in a table
 * with this behaviour you should be able to set and get the value
 * however the meta data will be read only
 */

goog.provide('recoil.ui.frp.message');

goog.require('goog.object');
goog.require('recoil.frp.util');
goog.require('recoil.ui.message');
goog.require('recoil.ui.message.MessageEnum');

/**
 *
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.ui.message.Message|!recoil.frp.Behaviour<!recoil.ui.message.Message>} message
 * @param {!recoil.frp.Behaviour<!Object>|!Object} data
 * @return {!recoil.frp.Behaviour<!recoil.ui.message.Message>}
 */
recoil.ui.frp.message.resolve = function(frp, message, data) {
    var dataB = recoil.frp.struct.flatten(frp, data);
    var messageB = new recoil.frp.Util(frp).toBehaviour(message);
    return frp.liftB(function(message, data) {
        return message.resolve(data);
    }, messageB, dataB);
};

/**
 *
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.ui.message.Message|!recoil.frp.Behaviour<!recoil.ui.message.Message>} message
 * @param {(!recoil.frp.Behaviour<!Object>|!Object)=} opt_data
 * @return {!recoil.frp.Behaviour<!recoil.ui.message.Message>}
 */
recoil.ui.frp.message.toString = function(frp, message, opt_data) {
    var data = opt_data || {};
    var resolvedB = recoil.ui.frp.message.resolve(frp, message, data);

    return frp.liftB(function(message) {
        return message.toString();
    }, resolvedB);
};

/**
 * @template T
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<T>|T} value
 * @param {!recoil.ui.message.MessageEnum|!recoil.frp.Behaviour<!recoil.ui.message.MessageEnum>} enumMap
 * @return {!recoil.frp.Behaviour<!recoil.ui.message.Message>}
 */
recoil.ui.frp.message.resolveEnum = function(frp, value, enumMap) {
    var util = new recoil.frp.Util(frp);
    var valueB = util.toBehaviour(value);
    var enumMapB = util.toBehaviour(enumMap);
    return frp.liftB(function(value, map) {
        return map.resolve(value);
    }, valueB, enumMapB);
};

/**
 * @template T
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<T>|T} value
 * @param {!recoil.ui.message.MessageEnum|!recoil.frp.Behaviour<!recoil.ui.message.MessageEnum>} enumMap
 * @return {!recoil.frp.Behaviour<!recoil.ui.message.Message>}
 */
recoil.ui.frp.message.enumToString = function(frp, value, enumMap) {
    return recoil.ui.frp.message.toString(frp, recoil.ui.frp.message.resolveEnum(frp, value, enumMap));
};
