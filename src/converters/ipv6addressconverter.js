goog.provide('recoil.converters.IPv6AddressConverter');

goog.require('recoil.types');
goog.require('recoil.ui.message.Message');

/**
 * @constructor
 * @implements {recoil.converters.TypeConverter<T, string>}
 */
recoil.converters.IPv6AddressConverter = function() {
};

/**
 * @param {recoil.types.IPv6Address} val
 * @return {!{error : recoil.ui.message.Message, value : string}}
 */
recoil.converters.IPv6AddressConverter.prototype.convert = function(val) {

    var ipAddrString = this.ipAddressToString_(val);

    return (this.checkIPAddressValid_(ipAddrString)) ? {error: recoil.ui.messages.VALID, value: ipAddrString} :
        {error: recoil.ui.messages.INVALID, value: ipAddrString};

};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : recoil.types.IPv6Address}}
 */
recoil.converters.IPv6AddressConverter.prototype.unconvert = function(val) {
    /**
     * @type recoil.types.IPv6Address
     */
    var res = [];
    var parts = val; //.split(':');
    var ipAddrString = this.ipAddressToString_(parts);

    for (var i = 0; i < parts.length; i++) {
        if (this.checkIPAddressValid_(ipAddrString)) {
            res.push(parts[i]);
        } else {
            return {error: recoil.ui.messages.INVALID, value: []};
        }
    }

    return {error: recoil.ui.messages.VALID, value: res};
};

/**
 * @private
 * @param {!Array<?>} addr
 * @return {string}
 */
recoil.converters.IPv6AddressConverter.prototype.ipAddressToString_ = function(addr) {
    var res = addr[0];

    for (var i = 1; i < addr.length; i++) {
        if (addr[i] === ':') {
            addr[i] = '0000';
        }
        res += ':' + addr[i];
    }

    return res;
};

/**
 * @private
 * @param {!string} str
 * @return {boolean}
 */
recoil.converters.IPv6AddressConverter.prototype.checkIPAddressValid_ = function(str) {
    var parts = str.split(":");

    // if more than 1 part is "" not at beginning or oendthen fail
    // if part "" at beginning or end then must be a blank
    // last part can be ipv4 address if so max parts is 7 else 8
    // number of parts is not max must contain a ::
    // each hex part has max 4 chars
    // all non ipv4 parts can only contain hex digits
    // ipv4 validation
    // must contain 4 parts seperated by . each with only base 10 digits
    // value of each part between (inclusive) 0 and 255

    if (parts.length > 2) {
        var lastPart = parts[parts.length - 1];
        if (lastPart.indexOf('.') !== -1) {
            var convertedIpv4 = new recoil.converters.IPv4AddressConverter().convert(lastPart);
            if (convertedIpv4.error) {
                return convertedIpv4;
            }
        }
    }


    return (/^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?$/.test(str));

};
