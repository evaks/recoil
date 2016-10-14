goog.provide('recoil.ui.actions.Action');

goog.require('recoil.frp.Behaviour');
goog.require('recoil.ui.WidgetScope');

/**
 *
 * @interface
 */
recoil.ui.actions.Action = function() {

};


/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @return {!recoil.frp.Behaviour.<*>}
 */


recoil.ui.actions.Action.prototype.createCallback = function(scope) {
};
