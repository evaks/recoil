goog.provide('recoil.converters.IPv6AddressConverter');

goog.require('recoil.converters.IPv4AddressConverter');
goog.require('recoil.types');
goog.require('recoil.ui.message.Message');
goog.require('recoil.ui.messages');


/**
 *
 * @param {!boolean} removeZeroSeq
 * @param {!boolean} stripLeadingZeros
 * @param {!boolean} ipV4 whether or not to display ipv4 segment to user
 * @constructor
 * @implements {recoil.converters.TypeConverter<recoil.types.IPv6Address, string>}
 */
recoil.converters.IPv6AddressConverter = function(removeZeroSeq, stripLeadingZeros, ipV4) {
    this.removeZeroSeq_ = removeZeroSeq;
    this.stripLeadingZeros_ = stripLeadingZeros;
    this.ipv4_ = ipV4;
};

/**
 *
 * @type {number}
 */
recoil.converters.IPv6AddressConverter.maxLength = 45;

/**
 *
 * @param {!string} c
 * @return {boolean}
 */
recoil.converters.IPv6AddressConverter.charValidator = function(c) {
    return (c >= '0' && c <= '9') || c === ':' || c === '.' || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');
};


/**
 * @param {recoil.types.IPv6Address} val
 * @return {!string}
 */
recoil.converters.IPv6AddressConverter.prototype.convert = function(val) {
    var parts = [];

    var maxLen = undefined;
    var maxLenStart = undefined;
    var curLen = 0;
    var curStart;

    for (var i = 0; i < val.length; i++) {
        var part = val[i].toString(16);


        if (!this.stripLeadingZeros_) {
            part = ('0000' + part).substr(part.length);
        }
        if (val[i] === 0) {
            if (curStart === undefined) {
                curStart = i;
                curLen = 1;
            }
            else {
                curLen++;
            }
            if (maxLen === undefined || maxLen < curLen) {
                maxLen = curLen;
                maxLenStart = curStart;
            }
        }
        else {
            curStart = undefined;
        }
        parts.push(part);
    }


    var res = [];
    var i = 0;
    while (i < parts.length) {
        if (i === maxLenStart && this.removeZeroSeq_ && maxLen > 1) {
            res.push(i === 0 ? '::' : ':');
            i += maxLen;
        }
        else {
            res.push(i === 7 ? parts[i] : parts[i] + ':');
            i++;
        }
    }

    return res.join('');
};

/**
 * @param {string} val
 * @return {!{error : recoil.ui.message.Message, value : recoil.types.IPv6Address}}
 */
recoil.converters.IPv6AddressConverter.prototype.unconvert = function(val) {
    // if more than 1 part is "" not at beginning or end then fail
    // if part "" at beginning or end then must be a blank
    // last part can be ipv4 address if so max parts is 7 else 8
    // number of parts is not max must contain a ::
    // each hex part has max 4 chars
    // all non ipv4 parts can only contain hex digits
    // ipv4 validation
    // must contain 4 parts seperated by . each with only base 10 digits
    // value of each part between (inclusive) 0 and 255

    /**
     * @type {recoil.types.IPv6Address}
     */
    var ret = [];

    var parts = val.split(':');
    var ipV4Parts = [];

    if (parts.length > 0) {
        if (parts[parts.length - 1].indexOf('.') !== -1) {
            var res = new recoil.converters.IPv4AddressConverter().unconvert(parts[parts.length - 1]);
            if (res.error) {
                return {error: res.error, value: null};
            }
            ipV4Parts = [res.value[0] << 8 | res.value[1], res.value[2] << 8 | res.value[3]];
        }

    }

    var requiredLen = ipV4Parts.length > 0 ? 6 : 8;
    if (ipV4Parts.length > 0) {
        parts.pop();
    }

    if (parts.length < 2) {
        return {error: recoil.ui.messages.INVALID_LENGTH, value: []};
    }

    var requiresBlank = false;
    if (parts[0] === '') {
        requiresBlank = true;
        parts.shift();
    }

    if (requiredLen === 8 && parts[parts.length - 1] === '') {
        requiresBlank = true;
        parts.pop();
    }

    var hasBlank = false;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        if (part.length > 4) {
            return {error: recoil.ui.messages.INVALID_LENGTH, value: []};
        }

        if (!part.match(/^[a-fA-F0-9]*$/)) {
            return {error: recoil.ui.messages.INVALID_CHARACTER, value: []};
        }

        if (part === '' && hasBlank) {
            return {error: recoil.ui.messages.INVALID, value: []};
        }

        if (part === '') {
            hasBlank = true;
            ret.push(0);
            for (var j = parts.length; j < requiredLen; j++) {
               ret.push(0);
            }
        }
        else {
            ret.push(parseInt(part, 16));
        }
    }
    if ((requiresBlank && !hasBlank) || requiredLen !== ret.length) {
        return {error: recoil.ui.messages.INVALID, value: []};
    }

    return {error: null, value: ret.concat(ipV4Parts)};

};
