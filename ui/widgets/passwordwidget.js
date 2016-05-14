goog.provide('recoil.ui.widgets.PasswordWidget');

goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Util');


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.PasswordWidget = function(scope) {
    this.scope_ = scope;
    this.password_ = new goog.ui.Component();

};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PasswordWidget.prototype.getComponent = function() {
    return this.password_;
};
