goog.provide('recoil.ui.widgets.CheckboxWidget');

goog.require('goog.events');
goog.require('goog.ui.Component');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.Checkbox.State');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.ComponentWidgetHelper');


/**
 * @constructor
 * @implements {recoil.ui.Widget}
 * @param {!recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.CheckboxWidget = function(scope) {
    this.scope_ = scope;
    this.checkBox_ = new goog.ui.Checkbox();
    this.isChecked = false;

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.checkBox_, goog.ui.Component.EventType.CHANGE);
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.checkBox_, this, this.updateState_);
};

/**
 * list of functions available when creating a CHECKBOXWidget
 */
recoil.ui.widgets.CheckboxWidget.options = recoil.util.Options('name', 'value', 'enabled');

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.CheckboxWidget.prototype.getComponent = function() {
    return this.checkBox_;
};


/**
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<boolean>|boolean} value
 * @param {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|boolean} enabled
 */
recoil.ui.widgets.CheckboxWidget.prototype.attach = function (name, value, enabled) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.attachStruct(recoil.frp.struct.extend(frp, enabled, {'name': name, 'value': value}));
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.CheckboxWidget.prototype.attachStruct = function (options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);

    this.nameB_    = structs.get('name', optionsB, '');
    this.valueB_   = structs.get('value', optionsB, recoil.ui.BoolWithExplanation.FALSE);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplanation.TRUE);

    var readyB = util.isAllGood(this.nameB_, this.valueB_, this.enabledB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function (v) {
        me.valueB_.set(me.checkBox_.getChecked());
    }, me.valueB_));

    this.helper_.attach(this.nameB_, this.valueB_, this.enabledB_);

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.CheckboxWidget.prototype.updateState_ = function (helper) {
    if(helper.isGood()){
        this.checkBox_.setChecked(this.valueB_.get());
    }
};




