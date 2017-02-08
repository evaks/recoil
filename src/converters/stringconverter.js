goog.provide('recoil.converters.DefaultStringConverter');
goog.provide('recoil.converters.MinLength');
goog.provide('recoil.converters.RegExp');
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

/**
 * does no actual coversions, however will match a regular expression
 * on the uncovert stage
 * @constructor
 * @implements {recoil.converters.StringConverter<string>}
 * @param {!RegExp} regExp
 */

recoil.converters.RegExp = function(regExp) {
    this.regExp_ = regExp;
};
/**
 * @param {string} val
 * @return {string}
 */
recoil.converters.RegExp.prototype.convert = function(val) {
    return val;
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : string}}
 */
recoil.converters.RegExp.prototype.unconvert = function(val) {
    if (val && val.match(this.regExp_)) {
        return {error: null, value: val};
    }
    return {error: recoil.ui.messages.INVALID, value: ''};
};


/**
 * @constructor
 * @implements {recoil.converters.StringConverter<string>}
 * @param {!number} len
 */

recoil.converters.MinLength = function(len) {
    this.len_ = len;
};
/**
 * @param {string} val
 * @return {string}
 */
recoil.converters.MinLength.prototype.convert = function(val) {
    return val;
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : string}}
 */
recoil.converters.MinLength.prototype.unconvert = function(val) {
    if (val && val.length >= this.len_) {
        return {error: null, value: val};
    }
    return {error: recoil.ui.messages.MUST_BE_AT_LEAST_0_CHARACTORS.resolve({n: this.len_}), value: ''};
};

