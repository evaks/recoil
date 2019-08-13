goog.provide('recoil.converters.And');

goog.require('recoil.converters.TypeConverter');
goog.require('recoil.ui.message.Message');

/**
 * this uses all the provided converters validate uncovert, if any fail
 * then the error is returned, note it is they do not fail then it assumed that any
 * converter will do
 *
 * @constructor
 * @template FROM,TO
 * @implements {recoil.converters.TypeConverter<FROM,TO>}
 * @param {!recoil.converters.TypeConverter<FROM,TO>} converter
 * @param {...!recoil.converters.TypeConverter<FROM,TO>} var_converters
 */

recoil.converters.And = function(converter, var_converters) {
    this.converter_ = converter;

    this.converters_ = [];
    for (var i = 1; i < arguments.length; i++) {
        this.converters_.push(arguments[i]);
    }
};
/**
 * @param {FROM} val
 * @return {TO}
 */
recoil.converters.And.prototype.convert = function(val) {
    return this.converter_.convert(val);
};

/**
 * @param {TO} val
 * @return {{error : recoil.ui.message.Message, value : FROM}}
 */
recoil.converters.And.prototype.unconvert = function(val) {
    var res = this.converter_.unconvert(val);
    if (res.error) {
        return res;
    }

    for (var i = 0; i < this.converters_.length; i++) {
        res = this.converters_[i].unconvert(val);
        if (res.error) {
            return res;
        }
    }
    return res;
};
