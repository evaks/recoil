/**
 * Radio button widget
 * the inputs are value and a selected value
 *
 */
goog.provide('recoil.ui.widgets.DateWidget');

goog.require('goog.date');
goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('goog.ui.Container');
goog.require('goog.ui.DatePicker');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.EventHelper');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.message.Message');
goog.require('recoil.ui.messages');
goog.require('recoil.ui.util');

/**
 *
 * @template T
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 * @constructor
 */
recoil.ui.widgets.DateWidget = function(scope) {
    this.scope_ = scope;

    // TODO for now force to ISO

    goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_ISO;
    var toControl = recoil.ui.ComponentWidgetHelper.elementToControl;
    this.container_ = new goog.ui.Component();
    this.picker_ = new goog.ui.DatePicker();
    this.picker_.setAllowNone(false);
    this.picker_.setShowWeekNum(false);
    this.message_ = goog.dom.createDom('div');

    this.container_.addChild(this.picker_, true);
    this.container_.addChild(toControl(this.message_), true);
    /*
    goog.events.listen(dp_de, goog.ui.DatePicker.Events.CHANGE, function(event) {
      goog.dom.setTextContent(document.getElementById('label_de'), event.date ?
          event.date.toIsoString(true) : 'none');
    });
*/
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.picker_, goog.ui.DatePicker.Events.CHANGE);
    this.tooltip_ = new recoil.ui.TooltipHelper(scope, this.picker_);
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.DateWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

/**
 * @type {!recoil.frp.Util.OptionsType}
 */
recoil.ui.widgets.DateWidget.options =
    recoil.ui.util.StandardOptions('value', {allowNone: false});


/**
 * we allow null dates since some date
 * @param {!recoil.frp.Behaviour<goog.date.Date>|goog.date.Date} value the widget that will be displayed in the popup
 * @suppress {missingProperties}
 */

recoil.ui.widgets.DateWidget.prototype.attach = function(value)  {
    recoil.ui.widgets.DateWidget.options.value(value).attach(this);
};


/**
 * @param {!Object|!recoil.frp.Behaviour<Object>} options
 * @suppress {missingProperties}
 */
recoil.ui.widgets.DateWidget.prototype.attachStruct = function(options) {
    var frp = this.helper_.getFrp();
    var bound = recoil.ui.widgets.DateWidget.options.bind(frp, options);
    var me = this;

    this.valueB_ = bound.value();
    this.enabledB_ = bound.enabled();
    this.allowNoneB_ = bound.allowNone();

    this.helper_.attach(this.valueB_, this.enabledB_, this.allowNoneB_);

    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function(v) {
        me.valueB_.set(me.picker_.getDate());
    }, this.valueB_, this.allowNoneB_));

    this.tooltip_.attach(this.enabledB_, this.helper_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.DateWidget.prototype.updateState_ = function(helper) {
    //    this.radio_.disabled = !helper.isGood() || !this.enabledB_.get().val();
    var good = helper.isGood();
    this.picker_.setAllowNone(!good || this.allowNoneB_.get());
    this.picker_.getContentElement().style.display = !good ? 'none' : '';
    this.helper_.setMessage(this.message_);
    if (good) {
        this.picker_.setDate(this.valueB_.get());
    }
    else {
        this.picker_.setDate(null);
    }


};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.DateWidget.prototype.getComponent = function() {
    return this.container_;
};
