goog.provide('recoil.converters.IPv4AddressConverter');

goog.require('recoil.types');
goog.require('recoil.ui.message.Message');

/**
 * @constructor
 * @implements {recoil.converters.TypeConverter<T, string>}
 */
recoil.converters.IPv4AddressConverter = function() {
};

/**
 * @param {recoil.types.IPv4Address} val
 * @return {!string}
 */
recoil.converters.IPv4AddressConverter.prototype.convert = function(val) {

    var res = val[0].toString();

    for (var i = 1; i < val.length; i++) {
        res += '.' + val[i];
    }

    return res;
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : recoil.types.IPv4Address}}
 */
recoil.converters.IPv4AddressConverter.prototype.unconvert = function(val) {
    /**
     * @type recoil.types.IPv4Address
     */
    var res = [];
    var parts = val.split('.');

    var err = new recoil.ui.message.Message([]);
    var num = 0;

    var partsLen = parts.length;

    for (var i = 0; i < partsLen; i++) {
        num = (typeof (parts[i]) === 'string') ? parseInt(parts[i], 10) : parts[i];
        if (partsLen !== 4 || isNaN(num) || num > 255 || num <= -1) {
            return {error: recoil.ui.messages.INVALID, value: []};
        } else {
            err = recoil.ui.messages.VALID;
            res.push(parseInt(parts[i], 10));
        }
    }

    return {error: null, value: res};
};
