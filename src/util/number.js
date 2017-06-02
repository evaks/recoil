goog.provide('recoil.util.number');

goog.require('goog.math.Long');
goog.require('goog.string');

/**
 * @param {!{value:!string, fraction_digits:!number}} val
 * @param {!number} dps
 * @return {!string}
 */
recoil.util.number.decimal64ToFixed = function(val, dps) {
    var long = goog.math.Long.fromString(val.value);
    if (long.isZero()) {
        if (dps > 0) {
            return '0.' + goog.string.repeat('0', dps);
        }
        return '0';
    }
    var abString = (long.isNegative() ? long.negate() : long).toString();
    var sign = long.isNegative() ? '-' : '';
    if (val.fraction_digits < 0) {
        abString += goog.string.repeat('0', val.fraction_digits);

    }
    else {
        var beforeDp = abString.substr(0, Math.max(0, abString.length - val.fraction_digits));
        var afterDp = goog.string.repeat('0', val.fraction_digits) + abString.substr(beforeDp.length);
        afterDp = afterDp.substr(afterDp.length - val.fraction_digits);

        if (beforeDp === '') {
            beforeDp = '0';
        }

        if (dps <= 0) {
            return sign + beforeDp;
        }
        afterDp = (afterDp + goog.string.repeat('0', dps)).substr(0, dps);
        if (afterDp === '') {
            return sign + beforeDp;
        }
        else {
            return sign + beforeDp + '.' + afterDp;
        }
    }



};
