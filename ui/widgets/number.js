goog.provide('recoil.ui.widgets.NumberWidget');

goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.events.PasteHandler');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Util');
goog.require('recoil.ui.BoolWithExplaination');
goog.require('recoil.ui.widgets.LabelWidget');

/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @constructor
 * @extends recoil.ui.LabeledWidget
 */
recoil.ui.widgets.NumberWidget = function(scope) {
    this.scope_ = scope;

    this.labelWidget_ = new recoil.ui.widgets.LabelWidget(scope);
    this.number_ = new recoil.ui.widgets.NumberWidget.NumberInput();

    this.valueHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateValue_);

    this.configHelper_ = new recoil.ui.ComponentWidgetHelper(scope, this.number_, this, this.updateConfig_);

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.number_, goog.events.EventType.BLUR);
};

recoil.ui.widgets.NumberWidget.DomHelper_ = function() {
    goog.dom.getDomHelper();
};


/**
 * @constructor
 * @extends {goog.ui.LabelInput}}
 */
recoil.ui.widgets.NumberWidget.NumberInput = function () {
    goog.ui.LabelInput.call(this);
    this.min_ = undefined;
    this.max_ = undefined;
    this.step_ = undefined;
    
    // we need this because some browsers don't filter keys
    this.keyFilter_ = function (e) {

        // Allow: backspace, delete, tab, escape, enter and .
        if (goog.array.contains([46, 8, 9, 27, 13, 110, 190],e.keyCode) ||
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


recoil.ui.widgets.NumberWidget.NumberInput.prototype.enterDocument = function() {
  recoil.ui.widgets.NumberWidget.NumberInput.superClass_.enterDocument.call(this);
  this.attachEvents_();
};


recoil.ui.widgets.NumberWidget.NumberInput.prototype.exitDocument = function() {
  recoil.ui.widgets.NumberWidget.NumberInput.superClass_.exitDocument.call(this);
  this.detachEvents_();

};



/**
 * Attaches the events we need to listen to.
 * @private
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.attachEvents_ = function() {
  var eh = new goog.events.EventHandler(this);

    goog.events.listen(this.getElement(), goog.events.EventType.BLUR,function () {
        console.log("foo");
    });

  eh.listen(this.getElement(), goog.events.EventType.FOCUS, this.handleFocus_);
  eh.listen(this.getElement(), goog.events.EventType.BLUR, this.handleBlur_);
    console.log("attachx",this.getElement());
};

recoil.ui.widgets.NumberWidget.NumberInput.prototype.handleFocus_ = function() {

    console.log("handle focus");
};


/** @override */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.disposeInternal = function() {
  goog.ui.LabelInput.superClass_.disposeInternal.call(this);
  this.detachEvents_();
};


/**
 * Stops listening to the events.
 * @private
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.detachEvents_ = function() {
  if (this.eventHandler_) {
    this.eventHandler_.dispose();
    this.eventHandler_ = null;
  }
};


recoil.ui.widgets.NumberWidget.NumberInput.prototype.handeFocus_ = function() {
    console.log("x");
};

recoil.ui.widgets.NumberWidget.NumberInput.prototype.handeBlur_ = function() {
    console.log("x");
};



recoil.ui.widgets.NumberWidget.NumberInput.prototype.setMin = function(min) {
    this.min_ = min;
    if (this.element_) {
        this.element_.min = min;
    }
};

recoil.ui.widgets.NumberWidget.NumberInput.prototype.setMax = function(max) {
    this.max_ = ma;
    if (this.element_) {
        this.element_.mac = max;
    }
};

recoil.ui.widgets.NumberWidget.NumberInput.prototype.setStep = function(step) {
    this.step_ = step;
    if (this.element_) {
        this.element_.step = step;
    }
};


/**
 * Creates the DOM nodes needed for the label input.
 * @override
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.createDom = function() {
    this.element_ =  this.getDomHelper().createDom(
        goog.dom.TagName.INPUT, 
        {'type': goog.dom.InputType.NUMBER, step: this.step_, min: this.min_, max: this.max_});
    var element = this.element_;
    var lastValid = 88;

    goog.events.listen(element
                       ,goog.events.EventType.KEYDOWN, this.keyFilter_);              
    goog.events.listen(element, goog.events.EventType.BLUR,
                       function () {
                           console.log("blur");
                           if (!element.validity.valid) {
                               element.value = lastValid;
                           }
                       });
    


    goog.events.listen(new goog.events.PasteHandler(element)
                       ,goog.events.PasteHandler.EventType.PASTE, 
                       function (e) {
                           var inputEl = e.target;
                           var origText = inputEl;

                           var clip = e.getBrowserEvent().clipboardData;

                           console.log("innerHtml", inputEl.innerHtml);
                           var txt = clip.getData('text/plain');
                           
                           txt = txt.replace(/[^0-9.+]/g, "F"); 
                           console.log("paste",e, txt);
//            e.preventDefault();
//                           e.stopPropagation();
                           //filter stuff here
                       });        

    goog.events.listen(new goog.events.InputHandler(element)
                       ,goog.events.PasteHandler.EventType.INPUT, 
                       function (e) {
                           var inputEl = e.target;
                           var origText = inputEl;

                           console.log("innerHtml", inputEl.innerHTML);

//            e.preventDefault();
//                           e.stopPropagation();
                           //filter stuff here
                       });        

    this.setElementInternal(element);
};

/**
 *
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.NumberWidget.prototype.getComponent = function() {
    return this.number_;
};

/**
 *
 * @return {recoil.ui.widgets.Widget}
 */
recoil.ui.widgets.NumberWidget.prototype.getLabel = function() {
    return this.labelWidget_;
};


/**
 *
 * @param {recoil.frp.Behaviour<T>} name
 * @param {recoil.frp.Behaviour<number>} value
 * @param {recoil.frp.Behaviour<recoil.ui.BoolWithExplaination>} enabled
 */
recoil.ui.widgets.NumberWidget.prototype.attach = function(name, value, min, max,step, enabled) {

    

    var frp = this.valueHelper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.nameB_ = util.toBehaviour(name,"");
    this.valueB_ = util.toBehaviour(value);
    this.minB_ = util.toBehaviour(min, NaN);
    this.maxB_ = util.toBehaviour(max, NaN);
    this.stepB_ = util.toBehaviour(step,1);
    this.enabledB_ = util.toBehaviour(enabled, recoil.ui.BoolWithExplaination.TRUE);

    var readyB = util.isAllGood(
        this.nameB_, this.valueB_,
        this.enabledB_, this.minB_,
        this.maxB_, this.stepB_);

    this.labelWidget_.attach(
        this.nameB_, 
        recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB));

    this.valueHelper_.attach(this.valueB_);
    this.configHelper_.attach(this.minB_, this.maxB_, this.stepB_, this.enabledB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        console.log("INPUT SET");
        me.valueB_.set(inputEl.value);
    }, this.valueB_));
};

/**
 *
 * @param data
 */
recoil.ui.widgets.NumberWidget.prototype.attachStruct = function(data) {

    var nameB = recoil.struct.get('name', data);
    var enabledB = recoil.struct.get('enabled', data);
    var valueB = recoil.struct.get('value', data);

    this.attach(nameB.get(), valueB.get(), enabledB.get());
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.NumberWidget.prototype.updateValue_ = function(helper) {
    if (helper.isGood()) {
        this.number_.setValue(this.valueB_.get());
        console.log("update value",this.valueB_.get());
    }
};

recoil.ui.widgets.NumberWidget.prototype.updateConfig_ = function(helper) {
    var enabled = helper.isGood() && this.valueHelper_.isGood();
    

    if (this.minB_.metaGet().good()) {
        this.number_.setMin(this.minB_.get());
    }


    if (this.stepB_.metaGet().good()) {
        this.number_.setStep(this.stepB_.get());
    }

};
