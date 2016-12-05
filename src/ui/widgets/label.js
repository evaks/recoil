/**
 * a simple widget to provide just text no formatting
 *
 */
goog.provide('recoil.ui.widgets.LabelWidget');

goog.require('goog.ui.Container');
goog.require('goog.ui.Control');
goog.require('goog.ui.LabelInput');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @implements {recoil.ui.Widget}
 * @param {!recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.LabelWidget = function(scope) {
    /**
     *
     * @type {recoil.ui.WidgetScope}
     * @private
     */
    this.scope_ = scope;

    /**
     *
     * @type {!goog.ui.Control}
     * @private
     */
    this.label_ = new goog.ui.Control();

    /**
     *
     * @type {goog.ui.Container}
     * @private
     */
    this.container_ = new goog.ui.Container();

    /**
     *
     * @type {recoil.ui.ComponentWidgetHelper}
     * @private
     */
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.label_, this, this.updateState_);
};

/**
 * list of functions available when creating a selectorWidget
 */
// recoil.ui.widgets.SelectorWidget.options =  recoil.util.Options('value' , {'!list': [1, 2, 3]}, {'renderer' : recoil.util.widgets.RENDERER},
//     { renderers :['button', 'menu']}, 'enabledItems');
recoil.ui.widgets.LabelWidget.options = recoil.frp.Util.Options(
    {
        'name' : '',
        'enabled' : recoil.ui.BoolWithExplanation.TRUE
    });

/**
 * @param {!recoil.frp.Behaviour<string>|!string} name
 * @param {!recoil.ui.BoolWithExplanation|!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} enabled
 */
recoil.ui.widgets.LabelWidget.prototype.attach = function(name, enabled) {
    this.attachStruct({name: name, enabled: enabled});

};


/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.LabelWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;


/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} value
 */
recoil.ui.widgets.LabelWidget.prototype.attachStruct = function(value) {
    var frp = this.helper_.getFrp();
    var bound = recoil.ui.widgets.LabelWidget.options.bind(frp, value);

    this.nameB_ = bound.name();
    this.enabledB_ = bound.enabled();
    this.helper_.attach(this.nameB_, this.enabledB_);
};


/**
 * gets the component of the widget that should be placed in the
 * dom
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.LabelWidget.prototype.getComponent = function() {
      return this.label_;
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.LabelWidget.prototype.updateState_ = function(helper) {

    if (helper.isGood()) {
        var arr = this.nameB_.get();
        if (goog.isString(arr)) {
            this.label_.setContent(arr);
        }
        else {
            this.label_.setContent("ERROR: not string: " + arr);
        }

    }
    else {
        this.label_.setContent('??');
    }
};

/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.LabelWidgetHelper = function(scope) {
    this.scope_ = scope;

};

/**
 *
 * @param {!string|!recoil.frp.Behaviour<!string>} name
 * @param {!recoil.ui.BoolWithExplanation|!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} enabled
 * @return {recoil.ui.widgets.LabelWidget}
 */
recoil.ui.widgets.LabelWidgetHelper.prototype.createAndAttach = function(name, enabled) {
    var label = new recoil.ui.widgets.LabelWidget(this.scope_);
    label.attach(name, enabled);
    return label;
};
