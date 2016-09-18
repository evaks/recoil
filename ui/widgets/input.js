goog.provide('recoil.ui.widgets.InputWidget');

goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.BoolWithExplaination');
goog.require('recoil.ui.widgets.LabelWidget');
/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements {recoil.ui.LabeledWidget}
 */
recoil.ui.widgets.InputWidget = function(scope) {
    this.scope_ = scope;

    //this.container_ = new goog.ui.Container();
    this.labelWidget_ = new recoil.ui.widgets.LabelWidget(scope);
    this.input_ = new goog.ui.LabelInput();
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.input_, this, this.updateState_);

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.InputHandler.EventType.INPUT);
};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.InputWidget.prototype.getComponent = function() {
    return this.input_;
};

/**
 *
 * @return {recoil.ui.Widget}
 */
recoil.ui.widgets.InputWidget.prototype.getLabel = function() {
    return this.labelWidget_;
};


/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} enabled
 */
recoil.ui.widgets.InputWidget.prototype.attach = function(name, value, enabled) {
    this.attachStruct({'name': name, 'value': value, 'enabled': enabled});
};

/**
 *
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.InputWidget.prototype.attachStruct = function(options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options); // util.toBehaviour(options);

    this.nameB_ = frp.liftB(function (val) { console.log("NAME"); return val;},structs.get('name', optionsB, ""));
    this.valueB_ = structs.get('value', optionsB);
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);
    var readyB = util.isAllGoodExplain(this.nameB_, this.valueB_, this.enabledB_);

     this.labelWidget_.attach(
         /** @type !recoil.frp.Behaviour */ (this.nameB_),
         recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB));

    this.helper_.attach(this.nameB_, this.valueB_, this.enabledB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        console.log('INPUT SET');
        me.valueB_.set(inputEl.value);
    }, this.valueB_));
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.updateState_ = function(helper) {

    if (helper.isGood()) {
        this.input_.setValue(this.valueB_.get());
        this.labelWidget_.getComponent().set
    }
};


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.InputWidgetHelper = function(scope) {
    this.scope_ = scope;
};
