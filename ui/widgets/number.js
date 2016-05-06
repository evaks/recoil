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

    goog.dom.getDomHelper();

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.input_, this, this.updateState_);

//    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.number_, goog.events.InputHandler.EventType.INPUT);
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
            console.log("keypress prevented", e.keyCode);
        }
    };

};

goog.inherits(recoil.ui.widgets.NumberWidget.NumberInput, goog.ui.LabelInput);


/**
 * Creates the DOM nodes needed for the label input.
 * @override
 */
recoil.ui.widgets.NumberWidget.NumberInput.prototype.createDom = function() {
    var element =  this.getDomHelper().createDom(
        goog.dom.TagName.INPUT, 
        {'type': goog.dom.InputType.NUMBER, step: 0.1});
    
    goog.events.listen(element
                       ,goog.events.EventType.KEYDOWN, this.keyFilter_);              
    goog.events.listen(new goog.events.InputHandler(element)
                       ,goog.events.InputHandler.EventType.INPUT, 
                       function (e) {
//                           var txt = e.clipboardData.getData('text/plain');
                           console.log("paste",e);
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
 * @param {recoil.frp.Behaviour<T>} value
 * @param {recoil.frp.Behaviour<BoolWithExplaination>} enabled
 */
recoil.ui.widgets.NumberWidget.prototype.attach = function(name, value, enabled) {
/*
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.nameB_ = util.toBehaviour(name);
    this.valueB_ = util.toBehaviour(value);
    this.enabledB_ = util.toBehaviour(enabled);

    var readyB = util.isAllGood(this.nameB_, this.valueB_, this.enabledB_);

    this.labelWidget_.attach(this.nameB_, this.valueB_, recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB));
    var reallyEnabledB = recoil.ui.BoolWithExplaination.and(frp, this.enabledB_, readyB);
    this.helper_.attach(this.valueB_, reallyEnabledB, util.toBehaviour(this.labelWidget_));

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        var inputEl = v.target;
        console.log("INPUT SET");
        me.valueB_.set(inputEl.value);
    }, this.valueB_));*/
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
recoil.ui.widgets.NumberWidget.prototype.updateState_ = function(helper) {

    if (helper.isGood()) {
        this.input_.setValue(this.valueB_.get());
    }
};

