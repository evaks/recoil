
goog.provide('recoil.ui.HtmlEncoder');



/**
 * An interface that allows widgets to set and get data from fields HTML
 * @interface
 * @template T
 */
recoil.ui.HtmlEncoder = function() {};


/**
 * encodes the value as html
 *
 * @param {T} value
 * @return {string}
 */
recoil.ui.HtmlEncoder.prototype.encode = function(value) {};

