// contains a widget that does the rendering

goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Button');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.ButtonWidget = function(scope) {
    this.scope_ = scope;

    /**
     * @private
     * @type {Element}
     */
    this.component_ = null;
    /**
     * @private
     */
    this.button_ = new goog.ui.Button();
    this.button_.setEnabled(false);
    this.button_.setContent('??');

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.button_, this, this.updateState_);

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.button_, goog.ui.Component.EventType.ACTION);
};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.ButtonWidget.prototype.getComponent = function() {
    return this.button_;
};

//recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {
//
//    this.callback_ = recoil.frp.struct.get('callback', value);
//    this.config_.attach(recoil.frp.struct.get('config', value, recoil.ui.widgets.ButtonWidget.defaultConfig));
//    this.state_.attach(this.callback_, recoil.frp.struct.get('text', value), recoil.frp.struct.get('tooltip', value, ""), recoil.frp.struct.get('enabled',
//            value, true));
//};

/**
 * @param {recoil.frp.Behaviour<!string>|!string} textB
 * @param {recoil.frp.Behaviour<*>} callbackB
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation} enabledB
 */
recoil.ui.widgets.ButtonWidget.prototype.attach = function(textB, callbackB, enabledB) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.textB_ = util.toBehaviour(textB);
    this.callbackB_ = util.toBehaviour(callbackB);
    this.enabledB = util.toBehaviour(enabledB);

    this.helper_.attach(this.textB_, this.callbackB_, this.enabledB);

    var me = this;
    this.changeHelper_.listen(this.callbackB_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour<!string>} textB
 * @param {recoil.frp.Behaviour<*>} callbackB
 * @param {recoil.frp.Behaviour<recoil.ui.BoolWithExplanation>} enabledB
 * @private
 */
recoil.ui.widgets.ButtonWidget.prototype.updateState_ = function(helper, textB, callbackB, enabledB) {
    if (this.button_) {
        this.button_.setEnabled(helper.isGood());
        if (helper.isGood()) {
          this.button_.setContent(textB.get());
          //this.button_.setEnabled(enabledB.get());

        }

    }
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.ButtonWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
