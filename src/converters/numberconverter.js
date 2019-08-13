goog.provide('recoil.converters.NullableIntToStringConverter');

goog.require('recoil.converters.StringConverter');
goog.require('recoil.ui.messages');


/**
 * @constructor
 * @implements {recoil.converters.StringConverter<number>}
 */

recoil.converters.NullableIntToStringConverter = function() {

};
/**
 * @param {number} val
 * @return {string}
 */
recoil.converters.NullableIntToStringConverter.prototype.convert = function(val) {
    if (val === null || val === undefined) {
        return '';
    }
    return '' + val;
};

/**
 * @param {string} val
 * @return {{error : recoil.ui.message.Message, value : number?}}
 */
recoil.converters.NullableIntToStringConverter.prototype.unconvert = function(val) {
    if (val === '') {
        return {error: null, value: null};
    }
    if (val.match(/^\d*$/)) {
        return {error: null, value: parseInt(val, 10)};
    }
    return {error: recoil.ui.messages.INVALID_VALUE, value: null};
};

