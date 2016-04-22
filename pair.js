goog.provide('recoil.Pair');

/**
 *
 * @constructor
 * @param {T} x
 * @param {T} y
 */
recoil.Pair = function(x, y) {
    this.label_ = x;
    this.inputField_ = y;
};

/**
 *
 * @return {T|*}
 */

recoil.Pair.prototype.getX = function() {
    return this.label_;
};


/**
 *
 * @return {T|*}
 */
recoil.Pair.prototype.getY = function() {
    return this.inputField_;
};
