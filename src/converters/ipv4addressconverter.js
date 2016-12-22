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
 * @return {!{error : recoil.ui.message.Message, value : string}}
 */
recoil.converters.IPv4AddressConverter.prototype.convert = function(val) {

    var res = val[0].toString();

    for (var i = 1; i < val.length; i++) {
        res += '.' + val[i];
    }

    return this.checkIPAddressValid_(val) ? {error: recoil.ui.messages.VALID, value: res} :
        {error: recoil.ui.messages.INVALID, value: res};
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

    for (var i = 0; i < parts.length; i++) {
        if (this.checkIPAddressValid_(parts)) {
            res.push(parseInt(parts[i], 10));
        } else {
            return {error: recoil.ui.messages.INVALID, value: []};
        }
    }

    return {error: recoil.ui.messages.VALID, value: res};
};

/**
 *
 * @param {!Array<?>} address
 * @return {boolean}
 * @private
 *
 */
recoil.converters.IPv4AddressConverter.prototype.checkIPAddressValid_ = function(address) {

    var num = 0;
    var addressLen = address.length;

    for (var i = 0; i < addressLen; i++) {
        num = (typeof (address[i]) === 'string') ? parseInt(address[i], 10) : address[i];
        if (addressLen !== 4 || isNaN(num) || num > 255 || num <= -1) {
            return false;
        }
    }

    return true;
};
