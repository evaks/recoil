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
 * get the next value and increment the counter
 * @return {goog.math.Long}
 */
recoil.util.Sequence.prototype.nextLong = function() {
    var res = this.val_;
    this.val_ = this.val_.add(goog.math.Long.getOne());
    return res;
};
