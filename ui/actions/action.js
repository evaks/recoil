goog.provide('recoil.ui.actions.Action');

goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.Behaviour');

/**
 *
 * @interface
 */
recoil.ui.actions.Action = function () {

};


/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @returns {!recoil.frp.Behaviour.<*>}
 */


recoil.ui.actions.Action.prototype.createCallback = function (scope) {
};