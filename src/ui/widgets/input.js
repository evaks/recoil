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
    this.containerDiv_ = goog.dom.createDom('div');
    var toControl = recoil.ui.ComponentWidgetHelper.elementToNoFocusControl;
    this.container_ = toControl(this.containerDiv_);
    this.curClasses_ = [];

    this.input_ = new goog.ui.LabelInput();
    this.readonly_ = new recoil.ui.widgets.LabelWidget(scope);

    this.input_.render(this.containerDiv_);
    this.readonly_.getComponent().render(this.containerDiv_);


    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.input_, this, this.updateState_, this.detach_);

    this.readonlyHelper_ = new recoil.ui.VisibleHelper(scope, this.containerDiv_, [this.input_.getElement()], [this.readonly_.getComponent().getElement()]);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.InputHandler.EventType.INPUT);
    this.keyPressHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.EventType.KEYDOWN);
    this.blurChangeHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.EventType.BLUR);
    this.pasteHelper_ = new recoil.ui.EventHelper(scope, this.input_, goog.events.EventType.PASTE);

    this.input_.setEnabled(false);
    this.enabledHelper_ = new recoil.ui.TooltipHelper(scope, this.input_, this.containerDiv_);
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
        width: undefined,
        outErrors: [],
        displayLength: undefined,
        charValidator: function() {return true;}
    }
);

/**
 *
 * @param {recoil.ui.widgets.InputWidget} me
 * @param {Element} inputEl
 * @param {boolean} setVal
 * @param {boolean} setError
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.updateElement_ = function(me, inputEl, setVal, setError) {
    var res = me.converterB_.get().unconvert(inputEl.value);
    var el = inputEl;
    if (!res.error) {
        if (setVal) {
            me.valueB_.set(res.value);
        }
        if (setError) {
            me.scope_.getFrp().accessTrans(function() {
                me.outErrorsB_.set([]);
            }, me.outErrorsB_);
        }
        goog.dom.classlist.remove(el, 'recoil-error');
    } else {
        if (setError) {
            me.scope_.getFrp().accessTrans(function() {
                me.outErrorsB_.set([res.error]);
            }, me.outErrorsB_);
        }
        goog.dom.classlist.add(el, 'recoil-error');
    }
};
/**
 * if not immediate we need to put data back before we detach
 * @private
 */
recoil.ui.widgets.InputWidget.prototype.detach_ = function() {
    var frp = this.helper_.getFrp();
    var me = this;
    this.lastValueB_ = undefined;
    this.lastConverter_ = undefined;
    frp.accessTrans(function() {
        if (me.immediateB_.good() && me.converterB_.good() && me.valueB_.good() && !me.immediateB_.get()) {
            me.updateElement_(me, me.input_.getElement(), true, false);
        }
    }, me.immediateB_, me.converterB_, me.valueB_);
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
    this.tooltipB_ = bound.tooltip();
    this.converterB_ = bound.converter();
    this.maxLengthB_ = bound.maxLength();
    this.widthB_ = bound.width();
    this.outErrorsB_ = bound.outErrors();
    this.displayLengthB_ = bound.displayLength();
    this.charValidatorB_ = bound.charValidator();
    this.classesB_ = bound.classes();
    this.spellcheckB_ = bound.spellcheck();

    var formatterB = frp.liftB(function(converter) {
        var func = function(val) {
            return converter.convert(val);
        };
        func.converter = converter;
        func.equals = function(other) {
            return other && recoil.util.object.isEqual(other.converter, converter);
        };
        return func;
    }, this.converterB_);
    this.readonlyHelper_.attach(this.editableB_);
    this.readonly_.attachStruct({name: this.valueB_, formatter: formatterB});
    this.helper_.attach(this.editableB_, this.valueB_, this.enabledB_, this.immediateB_, this.converterB_,
                        this.maxLengthB_, this.widthB_, this.displayLengthB_, this.charValidatorB_, this.classesB_, this.spellcheckB_, this.outErrorsB_);


    var me = this;

    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        me.updateElement_(me, inputEl, me.immediateB_.get(), false);
    }, this.valueB_, this.immediateB_, this.converterB_));

    var blurListener = function(v) {
        var inputEl = v.target;
        if (!me.immediateB_.get()) {
            me.updateElement_(me, inputEl, true, true);
        }
        else {
            frp.accessTrans(function() {
                if (me.converterB_.metaGet().good() && me.valueB_.metaGet().good()) {
                    var t = me.converterB_.get();
                    var strVal = t.convert(me.valueB_.get());
                    me.input_.setValue(strVal);
                    me.updateElement_(me, inputEl, false, true);
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
        }
        if (v.keyCode === goog.events.KeyCodes.ESC) {
            if (me.valueB_.metaGet().good() && me.converterB_.metaGet().good()) {
                var t = me.converterB_.get();
                var strVal = t.convert(me.valueB_.get());
                me.input_.setValue(strVal);
                me.updateElement_(me, v.target, true, true);
                v.preventDefault();
                return;
            }
        }


        var bevent = v.getBrowserEvent();
        var ch = bevent.key !== undefined ? bevent.key : bevent.char;
        // Allow: backspace, delete, tab, escape, enter
        if (goog.array.contains([116, 46, 40, 8, 9, 27, 13, 110], v.keyCode) ||
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

    }, this.valueB_, this.immediateB_, this.converterB_, this.charValidatorB_));

    this.pasteHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var bevent = v.getBrowserEvent();
        var ch = bevent.key !== undefined ? bevent.key : bevent.char;

        if (!me.charValidatorB_.get()(ch)) {
            var inputEl = v.target;
            var clip = v.getBrowserEvent().clipboardData;
            var txt = clip.getData('text/plain');

            var cleanTxt = '';
            for (var i = 0; i < txt.length; i++) {
                // if (charValidator(txt[i])) {
                 if (me.charValidatorB_.get()(txt[i])) {
                    cleanTxt += txt[i];
                }
            }

            // txt = txt.replace(/[^0-9.+]/g, 'F');
            if (cleanTxt != txt) {
                if (cleanTxt === '') {
                    v.preventDefault();
                }
                else {
                    var orig = inputEl.value;
                    var before = orig.substr(0, inputEl.selectionStart);
                    var after = orig.substr(inputEl.selectionEnd);
                    var maxLen = me.maxLengthB_.get();
                    if (maxLen !== undefined && maxLen > 0) {
                        var lengthRemaining = me.maxLengthB_.get() - (before + after).length;
                        cleanTxt = cleanTxt.substr(0, lengthRemaining);
                    }

                    var selPos = inputEl.selectionStart + cleanTxt.length;

                    inputEl.value = before + cleanTxt + after;

                    inputEl.selectionStart = selPos;
                    inputEl.selectionEnd = selPos;
                    me.updateElement_(me, v.target, me.immediateB_.get(), false);
                    v.preventDefault();
                }
            }
        }
    }, this.valueB_, this.converterB_, this.charValidatorB_, this.maxLengthB_, this.immediateB_));

    var tooltipB = frp.liftB(function(enabled, length, tooltip) {
         if (!enabled.val()) {
            return enabled;
        }
        if (tooltip !== recoil.ui.messages.BLANK) {
            if (tooltip === null) {
                return recoil.ui.BoolWithExplanation.TRUE;
            }
            return new recoil.ui.BoolWithExplanation(true, tooltip);
        }
        if (length !== undefined) {

            return new recoil.ui.BoolWithExplanation(true, recoil.ui.messages.MAX_LENGTH_0.resolve({len: length}));
        }
        return recoil.ui.BoolWithExplanation.TRUE;
    }, this.enabledB_, this.maxLengthB_, this.tooltipB_);
    this.enabledHelper_.attach(
        /** @type {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} */ (tooltipB),
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
    var maxLength = this.maxLengthB_.metaGet().good() ? this.maxLengthB_.get() : undefined;
    var width = this.widthB_.good() ? this.widthB_.get() : undefined;

    var displayLength = this.displayLengthB_.metaGet().good() ? this.displayLengthB_.get() : undefined;
    if (maxLength !== undefined) {
        el.maxLength = maxLength;
    } else if (el.maxLength !== undefined) {
        delete el.maxLength;
    }


    if (displayLength === undefined) {
        displayLength = maxLength;
    }

    if (this.spellcheckB_.metaGet().good()) {
        el.spellcheck = false;
    }

    this.curClasses_ = recoil.ui.ComponentWidgetHelper.updateClasses(this.input_.getElement(), this.classesB_, this.curClasses_);

    if (this.valueB_.metaGet().good() && this.converterB_.metaGet().good()) {
        var t = this.converterB_.get();
        var strVal = t.convert(this.valueB_.get());

        if (document.activeElement !== this.input_.getElement()) {
            var me = this;
            if (strVal !== this.input_.getValue()) {
                if (!recoil.util.object.isEqual(this.lastValueB_, this.valueB_.metaGet()) ||
                    !recoil.util.object.isEqual(this.lastConverter_, this.converterB_.metaGet())
                   ) {
                    this.input_.setValue(strVal);
                    this.updateElement_(this, me.input_.getElement(), false, true);
                }

            }
            else if (!recoil.util.object.isEqual(this.lastConverter_, this.converterB_.metaGet())) {
                this.updateElement_(this, me.input_.getElement(), false, true);
            }
        }

        if (displayLength === undefined) {
            delete this.input_.getContentElement().style.width;
        }
        else {
            if (typeof(displayLength) === 'string') {
                this.input_.getContentElement().style.width = displayLength;
            }
            else {
                this.input_.getContentElement().style.width = displayLength + 'em';
            }
        }
    }
    else {
        this.input_.setValue(recoil.ui.messages.NOT_READY.toString());
    }
    this.lastValueB_ = this.valueB_.metaGet();
    this.lastConverter_ = this.converterB_.metaGet();

};


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.InputWidgetHelper = function(scope) {
    this.scope_ = scope;
};

/**
 *
 * @param {string} type
 */
recoil.ui.widgets.InputWidget.prototype.setType = function(type) {
    this.input_.getContentElement().type = type;
};
