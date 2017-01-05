goog.provide('recoil.converters.DefaultStringConverter');
goog.provide('recoil.converters.StringConverter');

goog.require('recoil.ui.message.Message');

/**
 * @interface
 * @template T
 * @extends {recoil.converters.TypeConverter<T, string>}
 */
recoil.converters.StringConverter = function() {};


/**
 * @constructor
 * @implements {recoil.converters.StringConverter<string>}
 */

recoil.converters.DefaultStringConverter = function() {

};
/**
 * @param {string} val
 * @return {string}
 */
recoil.converters.DefaultStringConverter.prototype.convert = function(val) {
    return val;
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : string}}
 */
recoil.converters.DefaultStringConverter.prototype.unconvert = function(val) {
    return {error: null, value: val};
};
