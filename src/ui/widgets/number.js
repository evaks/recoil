goog.provide('recoil.ui.widgets.NumberWidget');


goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.PasteHandler');
goog.require('goog.html.SafeHtml');
goog.require('goog.ui.Component');
goog.require('goog.ui.Tooltip');
goog.require('goog.userAgent');
goog.require('recoil.frp.Array');
goog.require('recoil.frp.Util');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.LabeledWidget');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.messages');
goog.require('recoil.ui.util');
goog.require('recoil.ui.widgets.LabelWidget');

/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements {recoil.ui.Widget}
 */
recoil.ui.widgets.NumberWidget = function(scope) {
    this.scope_ = scope;
    this.containerDiv_ = goog.dom.createDom('div');
    var toControl = recoil.ui.ComponentWidgetHelper.elementToNoFocusControl;
    this.number_ = new recoil.ui.widgets.NumberWidget.NumberInput();
    this.number_.createDom();
    this.number_.setEnabled(false);

    this.container_ = toControl(this.containerDiv_);
    this.readonly_ = new recoil.ui.widgets.LabelWidget(scope);

    this.readonly_.getComponent().render(this.containerDiv_);
    this.number_.render(this.containerDiv_);

    this.valueHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateValue_, this.detach_);
    this.configHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateConfig_);
    this.errorHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, function() {});
    this.validatorHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateValidator_);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.number_, recoil.ui.EventHelper.EL_CHANGE);
    this.enabledHelper_ = new recoil.ui.TooltipHelper(scope, this.number_);
    this.readonlyHelper_ = new recoil.ui.VisibleHelper(scope, this.containerDiv_, [this.number_.getElement()], [this.readonly_.getComponent().getElement()]);
    this.keyPressHelper_ = new recoil.ui.EventHelper(scope, this.number_, goog.events.EventType.KEYDOWN);
};

/**
 * if not immediate we need to put data back before we detach
 * @private
 */
recoil.ui.widgets.NumberWidget.prototype.detach_ = function() {
    var frp = this.valueHelper_.getFrp();
    var me = this;
    frp.accessTrans(function() {

        if (me.valueB_.good()) {
            try {
                var element = me.number_.getElement();
                var val = element.value === '' ? null : parseFloat(element.value);
                if (element.validity.valid && element.value !== '') {
                    me.valueB_.set(val);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }, me.valueB_);
};
/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.NumberWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;


/**
 * @private
 * @return {!goog.dom.DomHelper}
 */
recoil.ui.widgets.NumberWidget.DomHelper_ = function() {
    return goog.dom.getDomHelper();
};


/**
 * @constructor
 * @extends {goog.ui.LabelInput}}
 */
recoil.ui.widgets.NumberWidget.NumberInput = function() {
    goog.ui.LabelInput.call(this);
    this.min_ = undefined;
    this.max_ = undefined;
    this.step_ = undefined;

    // we need this because some browsers don't filter keys
    this.keyFilter_ = function(e) {

        if (!goog.events.KeyCodes.isTextModifyingKeyEvent(e)) {
            return;
        }
        // Allow: backspace, delete, tab, escape, enter and .
        if (goog.array.contains([116, 46, 40, 8, 9, 27, 13, 110, 190], e.keyCode) ||
            // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
            // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
            // Allow: Ctrl+C
            (e.keyCode == 86 && e.ctrlKey === true) ||
            // Allow: Ctrl+X
               (e.keyCode == 88 && e.ctrlKey === true) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }
         // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && (e.keyCode !== 189)) {
            e.preventDefault();
        }
    };

};
goog.inherits(recoil.ui.widgets.NumberWidget.NumberInput, goog.ui.LabelInput);

/**
 *
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.enterDocument = function() {
  recoil.ui.widgets.NumberWidget.NumberInput.superClass_.enterDocument.call(this);
};


/**
 *
 */

recoil.ui.widgets.NumberWidget.NumberInput.prototype.exitDocument = function() {
  recoil.ui.widgets.NumberWidget.NumberInput.superClass_.exitDocument.call(this);
};

/**
 * @param {number} min
 */

recoil.ui.widgets.NumberWidget.NumberInput.prototype.setMin = function(min) {
    this.min_ = min;
    if (this.getElement()) {
        this.getElement().min = min;
    }
};

/**
 * @param {number} max
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.setMax = function(max) {
    this.max_ = max;
    if (this.getElement()) {
        this.getElement().max = max;
    }
};

/**
 * @param {number} step
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.setStep = function(step) {
    this.step_ = step;
    if (this.getElement()) {
        this.getElement().step = step;
    }
};


/**
 * Creates the DOM nodes needed for the label input.
 * @override
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.createDom = function() {
    var element = this.getDomHelper().createDom(
        goog.dom.TagName.INPUT,
        {
            'title' : goog.userAgent.EDGE_OR_IE ? '' : ' ',
            'class' : 'recoil-number-input',
            'type': goog.dom.InputType.NUMBER,
            step: this.step_, min: this.min_, max: this.max_});

    goog.events.listen(element,
                       goog.events.EventType.KEYDOWN, this.keyFilter_);

   element.style['text-align'] = 'right';
    this.setElementInternal(element);
};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.NumberWidget.prototype.getComponent = function() {
    return this.container_;
};


/**
 *
 * @param {recoil.frp.Behaviour<number>|number} value
 * @param {!recoil.frp.Behaviour<?>} options
 */
recoil.ui.widgets.NumberWidget.prototype.attachMeta = function(value, options) {
    var frp = this.valueHelper_.getFrp();

    this.attachStruct(recoil.frp.struct.extend(frp, options, {value: value}));
};


/**
 * the behaviours that this widget can take
 *
 * all standard options
 * value - number the number to edit
 * min - number the miniumn value
 * max - number the maxiumn value
 * step - step size of the number
 * validator - a function that takes a number and returns a message if it is invalid, else null
 *
 */
recoil.ui.widgets.NumberWidget.options = recoil.ui.util.StandardOptions(
    'value',
    {
        min: 0,
        max: Number.MAX_SAFE_INTEGER || 9007199254740991,
        displayLength: null,
        step: 1,
        allowNull: false,
        outErrors: [],
        validator: function(val) {return null;},
        readonlyFormatter: null,
        classes: []
    }
);

/**
 * @private
 * @param {number} num
 * @return {number} the number of decimal point this number has
 *
 */

recoil.ui.widgets.NumberWidget.getDp_ = function(num) {
    if (isNaN(num)) {
        return 0;
    }
    var str = num + '';
    var idx = str.indexOf('.');
    if (idx === -1) {
        return 0;
    }
    return str.length - 1 - idx;
};

/**
 * @private
 * @type {Object<string,number>}
 */
recoil.ui.widgets.NumberWidget.sizesMap_ = {};
/**
 * calculates the width of the number field based on the numbers that can go
 * into it
 * @private
 * @param {!Element} parent
 * @param {string} str
 * @return {number}
 */
recoil.ui.widgets.NumberWidget.calcWidth_ = function(parent, str) {
    var style = window.getComputedStyle(parent, null);
    var font = style.getPropertyValue('font-style') + ' ' +
            style.getPropertyValue('font-variant') + ' ' +
            style.getPropertyValue('font-size') + ' ' +
            style.getPropertyValue('font-family');

    var size = recoil.ui.widgets.NumberWidget.sizesMap_[font];
    if (size === undefined) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        ctx.font = font;
        size = ctx.measureText('0').width;
        recoil.ui.widgets.NumberWidget.sizesMap_[font] = size;

    }
    // 1 extra char for the arrows
    return (1 + str.length) * (size);

};

/**
 *
 * @param {!Object|!recoil.frp.Behaviour<!Object>} options
 */

recoil.ui.widgets.NumberWidget.prototype.attachStruct = function(options) {
    var frp = this.valueHelper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var arrUtil = new recoil.frp.Array(frp);
    var bound = recoil.ui.widgets.NumberWidget.options.bind(frp, options);

    this.valueB_ = bound.value();
    this.minB_ = bound.min();
    this.maxB_ = bound.max();
    this.displayLengthB_ = bound.displayLength();
    this.stepB_ = bound.step();
    this.editableB_ = bound.editable();
    this.enabledB_ = bound.enabled();
    this.classesB_ = bound.classes();
    this.validatorB_ = bound.validator();
    this.outErrorsB_ = bound.outErrors();
    this.allowNullB_ = bound.allowNull();
    this.hasErrors_ = false;

    this.formatterB_ = frp.liftB(function(min, step, fmt) {
        if (fmt) {
            return fmt;
        }
        var dp = Math.max(
            recoil.ui.widgets.NumberWidget.getDp_(min),
            recoil.ui.widgets.NumberWidget.getDp_(step));
        return function(v) {
             if (v === null || v === undefined) {
                return '';
            }
            return v.toLocaleString(undefined, {minimumFractionDigits: dp});
        };
    }, this.minB_, this.stepB_, bound.readonlyFormatter());

    this.errorHelper_.attach(this.outErrorsB_, this.validatorB_, this.allowNullB_, this.enabledB_);
    this.validatorHelper_.attach(this.validatorB_, this.allowNullB_, this.minB_, this.maxB_, this.stepB_);
    this.valueHelper_.attach(this.valueB_);

    this.configHelper_.attach(this.minB_, this.maxB_, this.stepB_, this.enabledB_, this.editableB_, this.formatterB_, this.displayLengthB_);

    this.readonlyHelper_.attach(this.editableB_);
    this.readonly_.attachStruct({name: this.valueB_,
                                 formatter: this.formatterB_,
                                 classes: arrUtil.append(this.classesB_, ['recoil-number'])
                                });
    var me = this;
    this.keyPressHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        if (v.keyCode === goog.events.KeyCodes.ESC) {
            me.updateValue_(me.valueHelper_);
        }
    }, this.valueB_, this.outErrorsB_, this.validatorB_, this.allowNullB_));

    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        if (inputEl.validity.valid && (inputEl.value !== '' || me.allowNullB_.get())) {
            var val = inputEl.value === '' ? null : parseFloat(inputEl.value);
            var error = me.validatorB_.get()(val);
            if (error) {
                me.updateErrors_(inputEl, me.outErrorsB_, me.validatorB_);
            }
            else {
                me.valueB_.set(val);
                me.updateErrors_(inputEl, me.outErrorsB_, me.validatorB_);
            }
        }
        else {
            me.updateErrors_(inputEl, me.outErrorsB_, me.validatorB_);
        }

    }, this.valueB_, this.outErrorsB_, this.validatorB_, this.allowNullB_));

    var toolTipB = frp.liftB(function(enabled, min, max, step) {
        if (!enabled.val()) {
            return enabled;
        }
        var reason = enabled.reason();
        if (reason && reason.toString() !== '') {
            return enabled;
        }
        var info = {'min': min, max: max, step: step};
        var message = step == 1 ? recoil.ui.messages.MIN_MAX.resolve(info)
            : recoil.ui.messages.MIN_MAX_STEP.resolve(info);
        return new recoil.ui.BoolWithExplanation(true, message);
    }, this.enabledB_, this.minB_, this.maxB_, this.stepB_);
    this.enabledHelper_.attach(
        /** @type {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} */ (toolTipB),
        this.valueHelper_, this.configHelper_);
};
/**
 * @private
 * @param {recoil.ui.ComponentWidgetHelper} helper
 */
recoil.ui.widgets.NumberWidget.prototype.updateValidator_ = function(helper) {
    var me = this;
    var hadErrors = this.hasErrors_;
    if (me.updateErrors_(me.number_.getElement(), me.outErrorsB_, me.validatorB_) && hadErrors) {
        this.scope_.getFrp().accessTrans(function() {
            if (me.valueB_.hasRefs() && me.valueB_.good()) {
                var element = me.number_.getElement();
                var val = element.value == '' ? null : parseFloat(element.value);
                me.valueB_.set(val);
            }
            return true;
        }, this.valueB_);
    }
};
/**
 * @private
 * @param {Element} el
 * @param {!recoil.frp.Behaviour<!Array>} errorsB
 * @param {!recoil.frp.Behaviour<!function(number):recoil.ui.message.Message>} validatorB
 * @return {!boolean} true if no error
 */
recoil.ui.widgets.NumberWidget.prototype.updateErrors_ = function(el, errorsB, validatorB) {
    var me = this;
    var res = false;
    this.scope_.getFrp().accessTrans(function() {
        var allowNull = (me.allowNullB_.hasRefs() && me.allowNullB_.good() && me.allowNullB_.get());
        if (me.editableB_.good() && !me.editableB_.get()) {
            res = true;
            errorsB.set([]);
            return;
        }
        if (me.enabledB_.good() && !me.enabledB_.get().val()) {
            res = true;
            if (me.valueB_.good()) {
                me.number_.setValue(me.valueB_.get());
            }
            errorsB.set([]);
            return;
        }
        // do the validation ourselves since it is inconsistent between browsers
        var manualValid = true;
         if (me.stepB_.hasRefs() && me.minB_.hasRefs() && me.maxB_.hasRefs() &&
                me.stepB_.good() && me.minB_.good() && me.maxB_.good()) {

            if (el.value === '') {
                manualValid = allowNull;
            }
            else {
                try {
                    var v = parseFloat(el.value);
                    if (v < me.minB_.get() || v > me.maxB_.get()) {
                        manualValid = false;
                    }
                    else {
                        v = v - me.minB_.get();

                        var mul = Math.pow(10, Math.max(
                            recoil.ui.widgets.NumberWidget.getDp_(me.minB_.get()),
                            recoil.ui.widgets.NumberWidget.getDp_(me.stepB_.get())));
                        var step = Math.floor(mul * me.stepB_.get());
                        v = Math.floor(v * mul);

                        manualValid = (v % step) === 0;
                    }
                }
                catch (e) {
                    manualValid = false;
                }
            }
        }

        if (manualValid && el.validity.valid && (el.value !== '' || allowNull)) {
            var v = el.value === '' ? null : parseFloat(el.value);
            var validator = validatorB.hasRefs() && validatorB.good() ? validatorB.get() : function() {return null;};
            var error = validator(v);
            if (error) {
                errorsB.set([error]);
            }
            else {
                errorsB.set([]);
                res = true;
            }
        }
        else {
            if (!me.stepB_.hasRefs() || !me.minB_.hasRefs() || !me.maxB_.hasRefs() ||
                !me.stepB_.good() || !me.minB_.good() || !me.maxB_.good()) {
                return;
            }
            if (me.stepB_.get() === 1) {
                errorsB.set([recoil.ui.messages.NUMBER_NOT_IN_RANGE.resolve(
                    {
                        min: me.minB_.get(),
                        max: me.maxB_.get()
                    })]);
            }
            else {
                errorsB.set([recoil.ui.messages.NUMBER_NOT_IN_RANGE_STEP.resolve(
                    {
                        min: me.minB_.get(),
                        max: me.maxB_.get(),
                        step: me.stepB_.get()

                    })]);
            }
        }

    }, errorsB, validatorB, me.allowNullB_, this.minB_, this.maxB_, this.stepB_, this.editableB_, this.enabledB_, me.valueB_);

    if (this.hasErrors_ !== !res) {
        if (res) {
            goog.dom.classlist.remove(el, 'recoil-error');
        }
        else {
            goog.dom.classlist.add(el, 'recoil-error');
        }
    }
    this.hasErrors_ = !res;

    return res;

};

/**
 *
 * @param {recoil.ui.ComponentWidgetHelper} helper
 * @private
 */
recoil.ui.widgets.NumberWidget.prototype.updateValue_ = function(helper) {
    if (helper.isGood()) {
        this.number_.setValue(this.valueB_.get());
        var me = this;
        this.updateErrors_(this.number_.getElement(), this.outErrorsB_, this.validatorB_);

    }
};

/**
 * @private
 * @param {recoil.ui.ComponentWidgetHelper} helper
 */
recoil.ui.widgets.NumberWidget.prototype.updateConfig_ = function(helper) {
    var enabled = helper.isGood();

    var el = this.containerDiv_;
    var formatter = this.formatterB_.metaGet().good() ?
        this.formatterB_.metaGet().get() : function(v) {
            return '' + v;
        };
    var displayLen = this.displayLengthB_.good() ? this.displayLengthB_.get() : null;
    var calcWidth = function(width, val) {
        if (displayLen) {
            return null;
        }
        var str = formatter(val);
        return Math.max(width,
                        recoil.ui.widgets.NumberWidget.calcWidth_(el, str));
    };

    var width = calcWidth(0, 0);
    if (this.minB_.metaGet().good()) {
        width = calcWidth(width, this.minB_.get());
        this.number_.setMin(this.minB_.get());
    }

    if (this.maxB_.metaGet().good()) {
        width = calcWidth(width, this.maxB_.get());
        this.number_.setMax(this.maxB_.get());
    }

    if (this.stepB_.metaGet().good()) {
        this.number_.setStep(this.stepB_.get());
    }
    var c = this.number_.getContentElement();
    //    c.width = 2;
    if (displayLen === -1) {
        this.number_.getContentElement().style.width = '';
        this.readonly_.getComponent().getElement().style.width = '';
    } else if (displayLen) {
        this.number_.getContentElement().style.width = (displayLen + 1) + 'em';
        this.readonly_.getComponent().getElement().style.width = displayLen + 'em';
    }
    else {
        this.number_.getContentElement().style.width = (width + 10) + 'px';
        this.readonly_.getComponent().getElement().style.width = (width) + 'px';
    }
    var hadErrors = this.hasErrors_;
    this.updateErrors_(this.number_.getElement(), this.outErrorsB_, this.validatorB_);
    if (hadErrors && !this.hasErrors_) {
        var me = this;
        var frp = this.valueHelper_.getFrp();
        frp.accessTrans(function() {

            if (me.valueB_.good()) {
            try {
                var element = me.number_.getElement();
                var val = element.value === '' ? null : parseFloat(element.value);
                me.valueB_.set(val);
            }
            catch (e) {
                console.error(e);
            }
        }
    }, me.valueB_);
    }
};
