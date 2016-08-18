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
    this.passwordInput_ = new recoil.ui.widgets.InputWidget(scope);

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.passwordInput_.getComponent(), this, this.updateState_);
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PasswordWidget.prototype.getComponent = function() {
    return this.passwordInput_.getComponent();
};

/**
 *
 * @returns {!recoil.ui.Widget}
 */
recoil.ui.widgets.PasswordWidget.prototype.getLabel = function () {
    return this.passwordInput_.getLabel();
};


/**
 * @param {recoil.frp.Behaviour<!string>|!string} inputName
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} enabled
 */
recoil.ui.widgets.PasswordWidget.prototype.attach = function (inputName, value, enabled) {
    this.passwordInput_.attach(inputName, value, enabled);
    // var util = new recoil.frp.Util(this.helper_.getFrp());
    //
    // this.labelNameB_ = util.toBehaviour(labelName);
    // this.inputNameB_ = util.toBehaviour(inputName);
    // this.valueB_ = util.toBehaviour(value);
    // this.enabledB_ = util.toBehaviour(enabled);
    //
    // this.helper_.attach(this.labelNameB_, this.inputNameB_, this.valueB_, this.enabledB_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 *
 */
recoil.ui.widgets.PasswordWidget.prototype.updateState_ = function () {

};