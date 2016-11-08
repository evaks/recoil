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
goog.require('goog.events.InputHandler');
goog.require('recoil.ui.widgets.LabelWidget');

/**
 * @implements {recoil.ui.LabeledWidget}
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.TextAreaWidget = function (scope) {
    this.scope_ = scope;
    this.textarea_ = new goog.ui.Textarea('');
    this.container_ = new goog.ui.Container();

    this.label_ = new recoil.ui.widgets.LabelWidget(scope);

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.textarea_, goog.events.InputHandler.EventType.INPUT);
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.textarea_, this, this.updateState_);
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.TextAreaWidget.prototype.getComponent = function () {
    return this.textarea_;
};

/**
 *
 * @returns {goog.ui.Container}
 */
recoil.ui.widgets.TextAreaWidget.prototype.getContainer = function () {
    return this.container_;
};

/**
 *
 * @returns {recoil.ui.widgets.LabelWidget}
 */
recoil.ui.widgets.TextAreaWidget.prototype.getLabel = function () {
    return this.label_;
};
/**
 * @param {recoil.frp.Behaviour<!string>|!string} nameB
 * @param {recoil.frp.Behaviour<!string>|!string} valueB
 * @param {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} opt_enabledB
 */
recoil.ui.widgets.TextAreaWidget.prototype.attach = function (nameB, valueB, opt_enabledB) {
    var frp = this.helper_.getFrp();
    
    this.attachStruct({'name': nameB, 'value': valueB, 'enabled': opt_enabledB });
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.TextAreaWidget.prototype.attachStruct = function (options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);
    
    var structs = recoil.frp.struct;
    var optionsB = structs.flatten(frp, options);
    
    this.valueB_   = structs.get('value', optionsB);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplanation.TRUE);
    var readyB = util.isAllGoodExplain(this.valueB_, this.enabledB_);

    this.label_.attach(
          structs.get('name', optionsB),
          recoil.ui.BoolWithExplanation.and(frp, this.enabledB_, readyB));

    this.helper_.attach(this.valueB_, this.enabledB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function (v) {
        me.valueB_.set(v.target.value);
    }, this.valueB_));
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.TextAreaWidget.prototype.updateState_ = function (helper) {

    if(helper.isGood()){
        this.textarea_.setContent(this.valueB_.get());
        this.textarea_.setEnabled(this.enabledB_.get());
    }
};



