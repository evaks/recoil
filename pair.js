goog.provide('recoil.Pair');

/**
 *
 * @constructor
 * @template TX
 * @template TY
 * @param {TX} x
 * @param {TY} y
 */
recoil.Pair = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 *
 * @return {TX}
 */

recoil.Pair.prototype.getX = function() {
    return this.x_;
};


/**
 *
 * @return {TY}
 */
recoil.Pair.prototype.getY = function() {
    return this.y_;
};
