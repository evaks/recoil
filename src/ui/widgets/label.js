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
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');
goog.require('recoil.ui.message.Message');

/**
 * @constructor
 * @template T
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
    this.label_.setAllowTextSelection(true);
    this.label_.setSupportedState(goog.ui.Component.State.FOCUSED, false);

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

    this.curClasses_ = [];
};

/**
 * a default formater that takes as a string and returns a string
 *
 * @template T
 * @private
 * @param {T} value
 * @return {!goog.ui.ControlContent}
 */
recoil.ui.widgets.LabelWidget.defaultFormatter_ = function(value) {
    if (goog.isString(value)) {
        return value;
    }
    else if (value instanceof recoil.ui.message.Message) {
        return value.toString();
    }
    else if (value instanceof Node) {
        return value;
    }
    else {
        return 'ERROR: not string but ' + typeof(value) + ': ' + value;
    }
};
/**
 * list of functions available when creating a selectorWidget
 */

recoil.ui.widgets.LabelWidget.options = recoil.frp.Util.Options(
    {
        'name' : '',
        'enabled' : recoil.ui.BoolWithExplanation.TRUE,
        'formatter' : recoil.ui.widgets.LabelWidget.defaultFormatter_,
        'classes' : []
    });
/**
 * list of functions available when creating a selectorWidget
 */
recoil.ui.widgets.LabelWidget.prototype.options = recoil.ui.widgets.LabelWidget.options;

/**
 * @param {!recoil.frp.Behaviour<string>|string} name
 * @param {(!recoil.ui.BoolWithExplanation|!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>)=} opt_enabled
 */
recoil.ui.widgets.LabelWidget.prototype.attach = function(name, opt_enabled) {
    this.attachStruct({name: name, enabled: opt_enabled});

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
    this.formatterB_ = bound.formatter();
    this.classesB_ = bound.classes();
    this.helper_.attach(this.nameB_, this.enabledB_, this.formatterB_, this.classesB_);
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
    this.curClasses_ = recoil.ui.ComponentWidgetHelper.updateClasses(this.label_.getElement(), this.classesB_, this.curClasses_);

    if (helper.isGood()) {
        var val = this.nameB_.get();
        var content = this.formatterB_.get()(val);
        if (content instanceof Node || goog.isString(content)) {
            this.label_.setContent(content);
        }
        else {
            this.label_.setContent(content + '');
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
 * @param {string|!recoil.frp.Behaviour<string>} name
 * @param {!recoil.ui.BoolWithExplanation|!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} enabled
 * @return {recoil.ui.widgets.LabelWidget}
 */
recoil.ui.widgets.LabelWidgetHelper.prototype.createAndAttach = function(name, enabled) {
    var label = new recoil.ui.widgets.LabelWidget(this.scope_);
    label.attach(name, enabled);
    return label;
};
