goog.provide('recoil.converters.IPv4AddressConverter');

goog.require('recoil.structs.IPv4Address');
goog.require('recoil.ui.message.Message');

/**
 * @constructor
 * @implements {recoil.converters.TypeConverter<recoil.structs.IPv4Address, string>}
 */
recoil.converters.IPv4AddressConverter = function() {
};

/**
 * @param {recoil.structs.IPv4Address} val
 * @return {string}
 */
recoil.converters.IPv4AddressConverter.prototype.convert = function(val) {
    var res = val[0];

    for (var i = 1; i < val.length; i++) {
        res += '.' + val[i];
    }
    return res;

};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : recoil.structs.IPv4Address}}
 */
recoil.converters.IPv4AddressConverter.prototype.unconvert = function(val) {
    var res = [];
    var parts = val.split('.');

    var err = '';
    var num = 0;

    var partsLen = parts.length;
    for (var i = 0; i < partsLen; i++) {
        num = parseInt(parts[i]);
        if (partsLen !== 4 || isNaN(num) || num > 255 || num <= -1) {
            return {error: recoil.ui.messages.INVALID, value: res.push(num)};
        } else {
            res.push(num);
        }
    }

    return {error: err, value: res};
};
