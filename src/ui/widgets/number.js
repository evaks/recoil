goog.provide('recoil.ui.widgets.NumberWidget');


goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.PasteHandler');
goog.require('goog.html.SafeHtml');
goog.require('goog.ui.Component');
goog.require('goog.ui.Tooltip');
goog.require('recoil.frp.Util');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.LabeledWidget');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.Widget');
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
    this.editableDiv_ = goog.dom.createDom('div');
    this.readonlyDiv_ = goog.dom.createDom('div');
    this.containerDiv_ = goog.dom.createDom('div');
    var toControl = recoil.ui.ComponentWidgetHelper.elementToControl;
    this.number_ = new recoil.ui.widgets.NumberWidget.NumberInput();

    this.container_ = toControl(this.containerDiv_);
    this.readonly_ = new recoil.ui.widgets.LabelWidget(scope);

    goog.dom.append(this.containerDiv_, this.editableDiv_);
    goog.dom.append(this.containerDiv_, this.readonlyDiv_);


    this.readonly_.getComponent().render(this.readonlyDiv_);
    this.number_.render(this.editableDiv_);

    this.valueHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateValue_);
    this.configHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateConfig_);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.number_, goog.events.EventType.BLUR);
    this.enabledHelper_ = new recoil.ui.TooltipHelper(scope, this.number_);
    this.readonlyHelper_ = new recoil.ui.VisibleHelper(scope, this.containerDiv_, [this.editableDiv_], [this.readonlyDiv_]);

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
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
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
            'class' : 'recoil-number-input',
            'type': goog.dom.InputType.NUMBER,
            step: this.step_, min: this.min_, max: this.max_});
    var lastValid = undefined;

    goog.events.listen(element
                       , goog.events.EventType.KEYDOWN, this.keyFilter_);
    goog.events.listen(element, goog.events.EventType.BLUR,
                       function() {
                           if (!element.validity.valid) {
                               if (lastValid !== undefined) {
                                   element.value = lastValid;
                               }
                           }

                       });
    goog.events.listen(element, goog.events.EventType.FOCUS,
                       function() {
                           if (element.validity.valid) {
                               lastValid = element.value;
                           }

                       });



    goog.events.listen(new goog.events.PasteHandler(element)
                       , goog.events.PasteHandler.EventType.PASTE,
                       function(e) {
                           var inputEl = e.target;
                           var origText = inputEl;

                           var clip = e.getBrowserEvent().clipboardData;

                           var txt = clip.getData('text/plain');

                           txt = txt.replace(/[^0-9.+]/g, 'F');
                           console.log('paste', e, txt);
//            e.preventDefault();
//                           e.stopPropagation();
                           //filter stuff here
                       });

    goog.events.listen(new goog.events.InputHandler(element)
                       , goog.events.PasteHandler.EventType.PASTE,
                       function(e) {
                           var inputEl = e.target;
                           var origText = inputEl;

                           console.log('innerHtml', inputEl.innerHTML);

//            e.preventDefault();
//                           e.stopPropagation();
                           //filter stuff here
                       });

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
 *
 */
recoil.ui.widgets.NumberWidget.options = recoil.ui.util.StandardOptions(
    'value',
    {
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        step: 1
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
    num = Math.abs(num);
    var fract = num - Math.floor(num);
    var dp = 0;
    var str = '' + fract;
    return Math.max(0, str.length - 2);
};

/**
 * calculates the width of the number field based on the numbers that can go
 * into it
 * @private
 * @param {!Element} parent
 * @param {string} str
 * @return {number}
 */
recoil.ui.widgets.NumberWidget.calcWidth_ = function(parent, str) {
    var tmp = document.createElement('span');
    var txt = goog.html.SafeHtml.unwrap(goog.html.SafeHtml.htmlEscape(str));
    tmp.innerHTML = txt;
    //        tmp.className = "input-element tmp-element";
    goog.dom.append(parent, tmp);
    var theWidth = tmp.getBoundingClientRect().width;
    parent.removeChild(tmp);

    return theWidth;
};

/**
 *
 * @param {!Object|!recoil.frp.Behaviour<!Object>} options
 */

recoil.ui.widgets.NumberWidget.prototype.attachStruct = function(options) {
    var frp = this.valueHelper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var bound = recoil.ui.widgets.NumberWidget.options.bind(frp, options);

    this.valueB_ = bound.value();
    this.minB_ = bound.min();
    this.maxB_ = bound.max();
    this.stepB_ = bound.step();
    this.editableB_ = bound.editable();
    this.enabledB_ = bound.enabled();

    this.formatterB_ = frp.liftB(function(min, step) {
        var dp = Math.max(
            recoil.ui.widgets.NumberWidget.getDp_(min),
            recoil.ui.widgets.NumberWidget.getDp_(step));
        return function(v) {
            return v.toLocaleString(undefined, {minimumFractionDigits: dp});
        };
    }, this.minB_, this.stepB_);

    this.valueHelper_.attach(this.valueB_);

    this.configHelper_.attach(this.minB_, this.maxB_, this.stepB_, this.enabledB_, this.formatterB_);

    this.readonlyHelper_.attach(this.editableB_);
    this.readonly_.attachStruct({name: this.valueB_,
                                 formatter: this.formatterB_
                                });


    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        me.valueB_.set(parseFloat(inputEl.value));
    }, this.valueB_));

    this.enabledHelper_.attach(
        /** @type {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} */ (this.enabledB_),
        this.valueHelper_, this.configHelper_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.NumberWidget.prototype.updateValue_ = function(helper) {
    if (helper.isGood()) {
        this.number_.setValue(this.valueB_.get());
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
    var calcWidth = function(width, val) {
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
    this.number_.getContentElement().style.width = (width + 10) + 'px';
};
