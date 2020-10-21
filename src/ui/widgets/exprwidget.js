goog.provide('recoil.ui.widgets.ExprWidget');

goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.events.InputHandler');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.Component');
goog.require('recoil.converters.DefaultStringConverter');
goog.require('recoil.frp.Chooser');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.util');
goog.require('recoil.ui.widgets.InputWidget');
goog.require('recoil.ui.widgets.LabelWidget');
goog.require('recoil.util.ExpParser');


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 * @implements {recoil.ui.Widget}
 */
recoil.ui.widgets.ExprWidget = function(scope) {
    this.scope_ = scope;
//    this.input_ = new goog.ui.LabelInput();
    this.input_ = new recoil.ui.widgets.InputWidget(scope);

    this.containerDiv_ = goog.dom.createDom('div');

};

/**
 * all widgets should not allow themselves to be flatterned
 *
 */
recoil.ui.widgets.ExprWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.ExprWidget.prototype.getComponent = function() {
    return this.input_.getComponent();
};

/**
 * attachable behaviours for widget
 */
recoil.ui.widgets.ExprWidget.options = recoil.ui.util.StandardOptions('value');

/**
 * @param {recoil.frp.Behaviour<string>|string} value
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation} opt_enabled
 */
recoil.ui.widgets.ExprWidget.prototype.attach = function(value, opt_enabled) {
    this.attachStruct({'value': value, 'enabled': opt_enabled});
};


/**
 * @constructor
 * @implements {recoil.converters.StringConverter<string>}
 */
recoil.ui.widgets.ExprConverter = function() {

};

/**
 * @param {string} val
 * @return {string}
 */
recoil.ui.widgets.ExprConverter.prototype.convert = function(val) {
    try {
        if (val == undefined) {
            return 'N/A';
        }
        var res = recoil.util.ExpParser.instance.eval(val);
        if (res == undefined) {
            return 'N/A';
        }
        return res + '';
    }
    catch (e) {
        return val;
    }
};

/**
 * @param {string} val
 * @return {{error : recoil.ui.message.Message, value : string}}
 */
recoil.ui.widgets.ExprConverter.prototype.unconvert = function(val) {
    console.log('unconvert - e', val);

    return {error: null, supported: false, value: val};
};


/**
 *
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.ExprWidget.prototype.attachStruct = function(options) {
    var frp = this.scope_.getFrp();
    var util = new recoil.frp.Util(frp);
    var me = this;
    var optionsB = recoil.frp.struct.flatten(frp, options);

    var expConverter = new recoil.ui.widgets.ExprConverter();
    var defConverter = new recoil.converters.DefaultStringConverter();

    var modOptions = recoil.frp.struct.extend(
        frp, options,
        {converter: recoil.frp.Chooser.if(
            this.input_.getFocus().debug('focus'), defConverter, expConverter)});


    this.input_.attachStruct(modOptions);
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.ExprWidget.prototype.updateState_ = function(helper) {

};
