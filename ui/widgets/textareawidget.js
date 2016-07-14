goog.provide('recoil.ui.widgets.TextAreaWidget');

goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.Widget');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.TextareaRenderer');
goog.require('recoil.ui.ComponentWidgetHelper');

/**
 * @implements {recoil.ui.Widget}
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.TextAreaWidget = function (scope) {
    this.scope_ = scope;
    this.textarea_ = new goog.ui.Textarea();

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.textarea_, this, this.updateState_);
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.TextAreaWidget.prototype.getComponent = function () {
    return this.textarea_;
};

/**
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} enabled
 */
recoil.ui.widgets.TextAreaWidget.prototype.attach = function (name, value, enabled) {
    var frp = this.helper_.getFrp();
    this.attachStruct(recoil.frp.struct.extend(frp, enabled, {'name': name, 'value': value}));
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.TextAreaWidget.prototype.attachStruct = function (options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);
    
    this.nameB_    = structs.get('name', optionsB, '');
    this.valueB_   = structs.get('value', optionsB, '');
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);

    this.helper_.attach(this.nameB_, this.valueB_, this.enabledB_);
    
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.TextAreaWidget.prototype.updateState_ = function (helper) {
    console.log('here');
    if(helper.isGood()){
        console.log('valueB', this.valueB_.get());
        this.textarea_.setContent(this.valueB_.get());
    }
};



