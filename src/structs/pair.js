goog.provide('recoil.structs.Pair');

/**
 *
 * @constructor
 * @template TX
 * @template TY
 * @param {TX} x
 * @param {TY} y
 */
recoil.structs.Pair = function(x, y) {
    this.x_ = x;
    this.y_ = y;
};

/**
 *
 * @return {TX}
 */

recoil.structs.Pair.prototype.getX = function() {
    return this.x_;
};


/**
 *
 * @return {TY}
 */
recoil.structs.Pair.prototype.getY = function() {
    return this.y_;
};
