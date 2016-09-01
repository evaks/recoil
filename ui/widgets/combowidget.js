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
 * @param {Array<recoil.frp.Behaviour<?>>|Array<?>} list
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} opt_enabled
 * @param {} opt_renderer
 */
recoil.ui.widgets.ComboWidget.prototype.attach = function (name, value, list, opt_enabled, opt_renderer) {
    this.attachStruct({'name': name, 'value': value, 'list': list, 'enabled': opt_enabled, 'renderer': opt_renderer });
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
    this.listB_ = structs.get('list', optionsB);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);
    this.rendererB_ = structs.get('renderer', optionsB);

    var readyB = util.isAllGoodExplain(this.valueB_, this.nameB_, this.listB_, this.enabledB_, this.rendererB_);

    this.helper_.attach(this.nameB_, this.valueB_, this.listB_, this.enabledB_, this.rendererB_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.ComboWidget.prototype.updateState_ = function (helper) {
  if(helper.isGood()){
      console.log('in updateState_', this.listB_);
  }
};
