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

    var el = this.passwordInput_.getComponent().getElement();
    el.setAttribute('type', 'password');
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PasswordWidget.prototype.getComponent = function() {
    return this.passwordInput_.getComponent();
};

/**
 *
 * @return {!recoil.ui.Widget}
 */
recoil.ui.widgets.PasswordWidget.prototype.getLabel = function() {
    return this.passwordInput_.getLabel();
};


/**
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation} enabled
 */
recoil.ui.widgets.PasswordWidget.prototype.attach = function(name, value, enabled) {
    //this.passwordInput_.attachStruct({'name': name, 'value': value, 'enabled': enabled});
    this.attachStruct({'name': name, 'value': value, 'enabled': enabled});

};

/**
 *
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.PasswordWidget.prototype.attachStruct = function(options) {
    this.passwordInput_.attachStruct(options);

};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.PasswordWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
