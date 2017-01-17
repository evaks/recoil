goog.provide('recoil.converters.IPv6AddressConverter');

goog.require('recoil.types');
goog.require('recoil.ui.message.Message');

/**
 *
 * @param {!boolean} removeZeroSeq
 * @param {!boolean} stripLeadingZeros
 * @param {!boolean} ipV4 whether or not to display ipv4 segment to user
 * @constructor
 * @implements {recoil.converters.TypeConverter<T, string>}
 */
recoil.converters.IPv6AddressConverter = function(removeZeroSeq, stripLeadingZeros, ipV4) {
    this.removeZeroSeq_ = removeZeroSeq;
    this.stripLeadingZeros_ = stripLeadingZeros;
    this.ipv4_ = ipV4;
};

/**
 * @param {recoil.types.IPv6Address} val
 * @return {!string}
 */
recoil.converters.IPv6AddressConverter.prototype.convert = function(val) {
    var parts = [];

    var currCount = 0;
    var longestCount = 0;
    var startPos = 0;
    var currPos = [];
    var allPositions = [];

    var maxLen = undefined;
    var maxLenStart = undefined;
    var curLen  = 0;
    var curStart;

    for (var i = 0; i < val.length; i++) {
        var part = val[i].toString(16);


        if (!this.stripLeadingZeros_) {
            part = ("0000" + part).substr(part.length);
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
        if (i === maxLenStart && this.removeZeroSeq_  && maxLen > 1) {
            res.push(i === 0 ? "::" : ":");
            i+= maxLen;
        }
        else {
            res.push( i === 7 ? parts[i] : parts[i] + ":");
            i++;
        }
    }

    return res.join("");
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
     * @type recoil.types.IPv6Address
     */
    var ret = [];

    var parts = val.split(':');
    var ipV4Parts = [];

    if (parts.length > 0) {
        if (parts[parts.length - 1].indexOf('.') !== -1) {
            var res = new recoil.converters.IPv4AddressConverter().unconvert(parts[parts.length -1]);
            if (res.error) {
                ret.push(res);
            }
            ipV4Parts = [res.value[0] << 8 | res.value[1], res.value[2] << 8 | res.value[3]];
        }

    }

    var requiredLen = ipV4Parts.length > 0 ? 6 : 8;
    if (ipV4Parts.length > 0 ) {
        parts.pop();
    }

    var currCount = 0;
    var longestCount = 0;
    var startPos = 0;
    var currPos = [];
    var allPositions = [];


    for (var i = 0 ;  i < parts.length; i++) {
        var p = parts[i];
        if(p.length > 4) {
            return {error: recoil.ui.messages.INVALID, value: []};
        }

        var value = parseInt(p, 16);
        if(value === 0) {
            currCount++;
            currPos.push(i);

        } else{
            currCount = 0;
            currPos = [];
        }

        if(currCount > longestCount) {
            longestCount = currCount;
            startPos = 0;
        }

        if(currPos.length > 0) {
            goog.array.insert(allPositions, currPos);
        }

        ret.push(value);
    }

    // var allPositionsCopy = allPositions;
    //
    // goog.array.sort(allPositionsCopy, function (a, b) {
    //     return b.length - a.length;
    // });

    // goog.array.splice(ret, allPositionsCopy[0].length, allPositionsCopy[0][0], "", "");

    // ret.splice(allPositionsCopy[0][0], allPositionsCopy[0].length, "", "");

    console.log('longest', longestCount, 'startPos', startPos, 'allPositions', allPositions);
    return {error: null, value : ret.concat(ipV4Parts)};

};

/**
 *
 * @param {!array} arr
 * @private
 */
recoil.converters.IPv6AddressConverter.prototype.findLongest_ = function (arr) {
    var curr = 0;
    var longest = 0;

    console.log('longest', longest);
};

/**
 *
 * @param {!string} val
 * @return {string}
 * @private
 */
recoil.converters.IPv6AddressConverter.prototype.stripLeadingZeros_ = function (val) {
    if(val.length > 0) {
        return goog.string.lastComponent(val, '0');
    }



};