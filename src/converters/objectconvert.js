goog.provide('recoil.converters.ObjectConverter');
goog.require('recoil.converters.StringConverter');

goog.require('recoil.ui.message.Message');


/**
 * this is really for debugging just convert to json, note will
 * not handle loops
 * @constructor
 * @implements {recoil.converters.StringConverter<*>}
 */
recoil.converters.ObjectConverter = function() {};

/**
 * @param {*} val
 * @return {string}
 */
recoil.converters.ObjectConverter.prototype.convert = function(val) {
    return JSON.stringify(val);
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : *}}
 */
recoil.converters.ObjectStringConverter.prototype.unconvert = function(val) {
    try {
        return {error: null, value: val === '' ? null : JSON.parse(val)};
    }
    catch (e) {
        return {error: recoil.ui.messge..getParamMsg('' + e)};
    }
};

