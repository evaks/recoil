goog.provide('recoil.ui.widgets.InputWidget');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.ui.Component');
goog.require('recoil.converters.DefaultStringConverter');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.util');
goog.require('recoil.ui.widgets.LabelWidget');

/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements {recoil.ui.Widget}
 */
recoil.ui.widgets.InputWidget = function(scope) {
    this.scope_ = scope;
    this.editableDiv_ = goog.dom.createDom('div');
    this.readonlyDiv_ = goog.dom.createDom('div');
    this.containerDiv_ = goog.dom.createDom('div');
    var toControl = recoil.ui.ComponentWidgetHelper.elementToControl;

    goog.dom.append(this.containerDiv_, this.editableDiv_);
    goog.dom.append(this.containerDiv_, this.readonlyDiv_);

    this.container_ = toControl(this.containerDiv_);
    this.readonly_ = new recoil.ui.widgets.LabelWidget(scope);
    this.input_ = new goog.ui.LabelInput();
    this.readonly_.getComponent().render(this.readonlyDiv_);
    this.input_.render(this.editableDiv_);
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.input_, this, this.updateState_);

    this.readonlyHelper_ = new recoil.ui.VisibleHelper(scope, this.containerDiv_, [this.editableDiv_], [this.readonlyDiv_]);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.InputHandler.EventType.INPUT);
    this.blurChangeHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.EventType.BLUR);
    this.input_.setEnabled(false);
    this.enabledHelper_ = new recoil.ui.TooltipHelper(scope, this.input_);
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 */

recoil.ui.widgets.InputWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.InputWidget.prototype.getComponent = function() {
    return this.container_;
};


/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation} enabled
 */
recoil.ui.widgets.InputWidget.prototype.attach = function(value, enabled) {
    this.attachStruct({'value': value, 'enabled': enabled});
};

/**
 * attachable behaviours for widget
 */
recoil.ui.widgets.InputWidget.options = recoil.ui.util.StandardOptions(
    'value',
    {
        immediate: false, // if false changes will not propogate untill blur
        converter: new recoil.converters.DefaultStringConverter()
    }
);

/**
 *
 * @param {recoil.ui.widgets.InputWidget} me
 * @param {Object} inputEl
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.updateElement_ = function(me, inputEl) {
    var res = me.converterB_.get().unconvert(inputEl.value);
    if (!res.error) {
        me.valueB_.set(res.value);
        goog.dom.setProperties(inputEl, {'class': ''});
    } else {
        goog.dom.setProperties(inputEl, {'class': 'recoil-error'});
    }
};

/**
 *
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.InputWidget.prototype.attachStruct = function(options) {
    var frp = this.helper_.getFrp();

    var bound = recoil.ui.widgets.InputWidget.options.bind(frp, options);

    this.valueB_ = bound.value();
    this.enabledB_ = bound.enabled();
    this.editableB_ = bound.editable();
    this.immediateB_ = bound.immediate();
    this.converterB_ = bound.converter();

    this.readonlyHelper_.attach(this.editableB_);
    this.readonly_.attach(this.valueB_);
    this.helper_.attach(this.editableB_, this.valueB_, this.enabledB_, this.immediateB_, this.converterB_);


    var me = this;

    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        if (me.immediateB_.get()) {
            me.updateElement_(me, inputEl);
        }
    }, this.valueB_, this.immediateB_, this.converterB_));

    this.blurChangeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        if (!me.immediateB_.get()) {
            me.updateElement_(me, inputEl);

        }

    }, this.valueB_, this.immediateB_, this.converterB_));

    this.enabledHelper_.attach(
        /** @type {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} */ (this.enabledB_),
        this.helper_);
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.updateState_ = function(helper) {

    var editable = this.editableB_.metaGet().good() || this.editableB_.get();
    this.input_.setEnabled(helper.isGood() && this.enabledB_.get().val());
    if (this.valueB_.metaGet().good()) {
        var t = this.converterB_.get();

        // t.convert(this.valueB_.get());
        var strVal = t.convert(this.valueB_.get());
        if (strVal !== this.input_.getValue()) {
            this.input_.setValue(strVal);
        }

    }
    else {
        this.input_.setValue(recoil.ui.messages.NOT_READY.toString());
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
