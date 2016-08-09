goog.provide('recoil.ui.widgets.PasswordWidget');

goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Util');
goog.require('recoil.ui.widgets.InputWidget');


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.PasswordWidget = function(scope) {
    this.scope_ = scope;
    this.password_ = new recoil.ui.widgets.InputWidget(scope);

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.password_, this, this.updateState_);
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PasswordWidget.prototype.getComponent = function() {
    return this.password_;
};

/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} enabled
 */
recoil.ui.widgets.PasswordWidget.prototype.attach = function (name, value, enabled) {

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 * 
 */
recoil.ui.widgets.PasswordWidget.prototype.updateState_ = function () {

};