goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('recoil.ui.WidgetScope');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 * @param {Element} container the container that the tree will go into
 */
recoil.ui.widgets.ButtonWidget = function (scope, container) {
    
};

recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {

    this.config_.attach(recoil.frp.struct.get('config', value, goog.ui.tree.TreeControl.defaultConfig));
    this.state_.attach(recoil.frp.struct.get('callback', value));
    this.state_.attach(recoil.frp.struct.get(enabled));

};
