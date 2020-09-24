goog.provide('recoil.db.Escaper');

/**
 * @interface
 */
recoil.db.Escaper = function() {};


/**
 * @param {string} str
 * @return {string}
 */
recoil.db.Escaper.prototype.escapeId = function(str) {};

/**
 * @param {?} str
 * @return {string}
 */
recoil.db.Escaper.prototype.escape = function(str) {};
