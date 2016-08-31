goog.provide('recoil.ui.widgets.ComboWidget');

goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.Widget');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.ComponentWidgetHelper');

/**
 * @implements {recoil.ui.Widget}
 * @param scope
 * @constructor
 */
recoil.ui.widgets.ComboWidget = function(scope) {
    this.scope_ = scope;
    this.combo_ = new goog.ui.ComboBox();

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.combo_, this, this.updateState_);
};

/**
 *
 * @returns {!goog.ui.Component}
 */
recoil.ui.widgets.ComboWidget.prototype.getComponent = function () {
    return this.combo_;
};

/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>} opt_enabled
 */
recoil.ui.widgets.ComboWidget.prototype.attach = function (name, value, opt_enabled) {
    this.attachStruct({'name': name, 'value': value, 'enabled': opt_enabled });
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.ComboWidget.prototype.attachStruct = function (options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);

    this.nameB_ = structs.get('name', optionsB);
    this.valueB_   = structs.get('value', optionsB);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);

    var readyB = util.isAllGoodExplain(this.valueB_, this.nameB_, this.enabledB_);

    this.helper_.attach(this.nameB_, this.valueB_, this.enabledB_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.ComboWidget.prototype.updateState_ = function (helper) {
  if(helper.isGood()){
      console.log('in updateState_');
  }
};
