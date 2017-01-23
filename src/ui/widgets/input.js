goog.provide('recoil.ui.widgets.InputWidget');

goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.events.KeyCodes');
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
    this.curClasses_ = [];

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
    this.keyPressHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.EventType.KEYDOWN);
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
        classes: [],
        immediate: false, // if false changes will not propogate until blur
        converter: new recoil.converters.DefaultStringConverter(),
        maxLength: undefined,
        charValidator: function() {}
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
    var el = goog.dom.getElement(inputEl.id);

    if (!res.error) {
        me.valueB_.set(res.value);
        goog.dom.classlist.remove(el, 'recoil-error');
    } else {
        goog.dom.classlist.add(el, 'recoil-error');
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
    this.maxLengthB_ = bound.maxLength();
    this.charValidatorB_ = bound.charValidator();
    this.classesB_ = bound.classes();

    this.readonlyHelper_.attach(this.editableB_);
    this.readonly_.attach(this.valueB_);
    this.helper_.attach(this.editableB_, this.valueB_, this.enabledB_, this.immediateB_, this.converterB_,
        this.maxLengthB_, this.charValidatorB_, this.classesB_);


    var me = this;

    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        me.updateElement_(me, inputEl);
    }, this.valueB_, this.immediateB_, this.converterB_));

    var blurListener = function(v) {
        var inputEl = v.target;
        if (!me.immediateB_.get()) {
            var t = me.converterB_.get();
            var strVal = t.convert(me.valueB_.get());
            me.input_.setValue(strVal);

            me.updateElement_(me, inputEl);
        }
        else {
            frp.accessTrans(function() {
                if (me.converterB_.metaGet().good() && me.valueB_.metaGet().good()) {
                    var t = me.converterB_.get();
                    var strVal = t.convert(me.valueB_.get());
                    me.input_.setValue(strVal);
                    me.updateElement_(me, inputEl);
                }
            }, me.converterB_, me.valueB_);
        }
    };

    this.blurChangeHelper_.listen(this.scope_.getFrp().createCallback(
        /** @type {function (...?): ?}*/ (blurListener), this.valueB_, this.immediateB_, this.converterB_));

    this.keyPressHelper_.listen(this.scope_.getFrp().createCallback(function(v) {


        if (!me.immediateB_.get()) {

            if (v.keyCode === goog.events.KeyCodes.ENTER) {
                 blurListener(v);
             }
             else if (v.keyCode === goog.events.KeyCodes.ESC) {
                 if (me.valueB_.metaGet().good() && me.converterB_.metaGet().good()) {
                     var t = me.converterB_.get();
                     var strVal = t.convert(me.valueB_.get());
                     me.input_.setValue(strVal);
                     me.updateElement_(me, v.target);
                 }
             }


        }

        var bevent = v.getBrowserEvent();
        var ch = bevent.key !== undefined ? bevent.key : bevent.char;

        if (me.charValidatorB_.get()(ch) !== undefined) {
            // Allow: backspace, delete, tab, escape, enter and .
            if (goog.array.contains([116, 46, 40, 8, 9, 27, 13, 110, 190], v.keyCode) ||
                // Allow: Ctrl+A
                (v.keyCode == 65 && v.ctrlKey === true) ||
                // Allow: Ctrl+C
                (v.keyCode == 67 && v.ctrlKey === true) ||
                // Allow: Ctrl+C
                (v.keyCode == 86 && v.ctrlKey === true) ||
                // Allow: Ctrl+X
                (v.keyCode == 88 && v.ctrlKey === true) ||
                // Allow: home, end, left, right
                (v.keyCode >= 35 && v.keyCode <= 39)) {
                // let it happen, don't do anything
                return;
            }

            if (!me.charValidatorB_.get()(ch)) {
                v.preventDefault();
            }

        }

    }, this.valueB_, this.immediateB_, this.converterB_, this.charValidatorB_));

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

    var el = this.input_.getElement();
    if (this.maxLengthB_.metaGet().good()) {
        if (this.maxLengthB_.get() !== undefined) {
            el.maxLength = this.maxLengthB_.get();
        } else {
            el.maxLength = 524288; // the default for an input field
        }
    }


    this.curClasses_ = recoil.ui.ComponentWidgetHelper.updateClasses(this.input_.getElement(), this.classesB_, this.curClasses_);

    if (this.valueB_.metaGet().good() && this.converterB_.metaGet().good()) {
        var t = this.converterB_.get();
        var strVal = t.convert(this.valueB_.get());

        if (document.activeElement !== this.input_.getElement()) {

            if (strVal !== this.input_.getValue()) {
                this.input_.setValue(strVal);
            }
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
