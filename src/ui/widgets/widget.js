goog.provide('recoil.ui.Widget');

goog.require('goog.ui.Component');
goog.require('recoil.frp.struct');
/**
 * @interface
 */
recoil.ui.Widget = function() {
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.Widget.prototype.getComponent = function() {

};


/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.Widget.prototype.flatten;

