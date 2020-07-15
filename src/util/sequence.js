goog.provide('recoil.util.Sequence');

goog.require('goog.math.Long');

/**
 * a class to create a incrementing sequence
 * of strings
 * @constructor
 */
recoil.util.Sequence = function() {
    this.val_ = goog.math.Long.getOne();
};
/**
 * get the next value and increment the counter
 * @return {string}
 */
recoil.util.Sequence.prototype.next = function() {
    var res = this.val_ + '';
    this.val_ = this.val_.add(goog.math.Long.getOne());
    return res;
};

/**
 * brings back to start
 */
recoil.util.Sequence.prototype.reset = function() {
    this.val_ = goog.math.Long.getOne();
};


/**
 * marks a value as seen will not generate it again
 *
 * @param {!goog.math.Long|string} val
 */
recoil.util.Sequence.prototype.seen = function(val) {
    if (typeof(val) === 'string') {
        var v = goog.math.Long.fromString(val);
        if (this.val_.lessThanOrEqual(v)) {
            this.val_ = v.add(goog.math.Long.getOne());
        }
    }
    else {
        if (this.val_.lessThanOrEqual(val)) {
            this.val_ = val.add(goog.math.Long.getOne());
        }
    }
};

/**
 * get the next value and increment the counter
 * @return {goog.math.Long}
 */
recoil.util.Sequence.prototype.nextLong = function() {
    var res = this.val_;
    this.val_ = this.val_.add(goog.math.Long.getOne());
    return res;
};
