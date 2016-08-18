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
recoil.ui.widgets.PasswordWidget = function (scope) {
    this.scope_ = scope;
    this.passwordInput_ = new recoil.ui.widgets.InputWidget(scope);

    var el = this.passwordInput_.getComponent().getElement();
    el.setAttribute('type', 'password');
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.passwordInput_.getComponent(), this, this.updateState_);
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PasswordWidget.prototype.getComponent = function () {
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
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} enabled
 */
recoil.ui.widgets.PasswordWidget.prototype.attach = function (name, value, enabled) {
    this.passwordInput_.attachStruct({'name': name, 'value': value, 'enabled': enabled});
};

/**
 *
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.PasswordWidget.prototype.attachStruct = function (options) {
    var util = new recoil.frp.Util(this.helper_.getFrp());
    var frp = this.helper_.getFrp();

    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);

    this.nameB_ = structs.get('name', optionsB);
    this.valueB_ = structs.get('value', optionsB);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);

    this.helper_.attach(this.nameB_, this.valueB_, this.enabledB_);

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 *
 */
recoil.ui.widgets.PasswordWidget.prototype.updateState_ = function (helper) {
    if(helper.isGood()){

    }
};