goog.provide('recoil.ui.widgets.InputWidget');

goog.require('recoil.ui.widgets.LabelWidget');
goog.require('recoil.frp.Util');
goog.require('goog.ui.Component');
goog.require('recoil.ui.BoolWithExplaination');

/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @constructor
 * @extends recoil.ui.LabeledWidget
 */
recoil.ui.widgets.InputWidget = function (scope) {
    this.scope_ = scope;

    //this.container_ = new goog.ui.Container();
    this.labelWidget_ = new recoil.ui.widgets.LabelWidget(scope);
    this.input_       = new goog.ui.LabelInput();
    this.helper_      = new recoil.ui.ComponentWidgetHelper(scope, this.input_, this, this.updateState_);


    this.changeHelper_ = new recoil.ui.EventHelper(this.input_,goog.ui.Component.EventType.CHANGE);
};

/**
 *
 * @returns {goog.ui.Component}
 */
recoil.ui.widgets.InputWidget.prototype.getComponent = function () {
    return this.input_;
};

/**
 *
 * @returns {recoil.ui.widgets.Widget}
 */
recoil.ui.widgets.InputWidget.prototype.getLabel = function () {
    return this.labelWidget_;
};


/**
 *
 * @param {recoil.frp.Behaviour<T>} name
 * @param {recoil.frp.Behaviour<T>} value
 * @param {recoil.frp.Behaviour<BoolWithExplaination>} enabled
 */
recoil.ui.widgets.InputWidget.prototype.attach = function (name, value, enabled) {

    var frp  = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.nameB_    = util.toBehaviour(name);
    this.valueB_   = util.toBehaviour(value);
    this.enabledB_ = util.toBehaviour(enabled);

    var readyB = util.isAllGood(this.nameB_, this.valueB_, this.enabledB_);

    this.labelWidget_.attach(this.nameB_, recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB));
    var reallyEnabledB = recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB);
    this.helper_.attach(this.valueB_, reallyEnabledB, util.toBehaviour(this.labelWidget_));


    var me = this;
    this.changeHelper_.listen(frp.createCallback(function() {
         me.valueB_.set(me.input_.getValue());
        console.log('here');
    }), this.valueB_ );


};

/**
 *
 * @param data
 */
recoil.ui.widgets.InputWidget.prototype.attachStruct = function (data) {

    var nameB    = recoil.struct.get("name", data);
    var enabledB = recoil.struct.get("enabled", data);
    var valueB   = recoil.struct.get("value", data);

    this.attach(nameB.get(), valueB.get(), enabledB.get());
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.updateState_ = function (helper) {

    if (helper.isGood()) {

        this.input_.setValue(this.valueB_.get());
    }
};


/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.InputWidgetHelper = function (scope) {
    this.scope_ = scope;
};

/**
 *
 * @param {String} name
 * @param {recoil.frp.Behaviour<T>} value
 * @param {recoil.frp.Behaviour<T>} enabled
 * @returns {recoil.ui.widgets.InputWidget}
 */
recoil.ui.widgets.InputWidgetHelper.prototype.createAndAttach = function (name, value, enabled) {
    var label = new recoil.ui.widgets.InputWidget(this.scope_);
    label.attach(name, value, enabled);
    return label;
};
