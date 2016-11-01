goog.provide('recoil.util.Handle');

/**
 * @template T
 * @param {T=} opt_value
 * @constructor
 */
recoil.util.Handle = function(opt_value) {
    this.value_ = opt_value;
};
/**
 *
 * @param {T} value
 */
recoil.util.Handle.prototype.set = function(value) {
    this.value_ = value;
};

/**
 * @return {T}
 */
recoil.util.Handle.prototype.get = function() {
    return this.value_;
};


