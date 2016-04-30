// contains a widget that does the rendering

goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Button');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');


/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 * @extends recoil.ui.Widget
 */
recoil.ui.widgets.ButtonWidget = function(scope) {
    this.scope_ = scope;

    /**
     * @type {Element}
     */
    this.component_ = null;
    /**
     * @private
     * @type goog.ui.Button
     *
     */
    this.button_ = new goog.ui.Button();
    this.config_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateState_);

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.button_, this, this.updateState_);

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.button_, goog.ui.Component.EventType.ACTION);
};

/**
 *
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.ButtonWidget.prototype.getComponent = function() {
    return this.button_;
};

/**
 * sets the associated container for the widget
 *
 * @param {Element} container
 */
recoil.ui.widgets.ButtonWidget.prototype.setComponent = function(container) {
    this.config_.setComponent(container);
    this.state_.setComponent(container);
};

//recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {
//
//    this.callback_ = recoil.frp.struct.get('callback', value);
//    this.config_.attach(recoil.frp.struct.get('config', value, recoil.ui.widgets.ButtonWidget.defaultConfig));
//    this.state_.attach(this.callback_, recoil.frp.struct.get('text', value), recoil.frp.struct.get('tooltip', value, ""), recoil.frp.struct.get('enabled',
//            value, true));
//};

/**
 *
 * @param {recoil.frp.Behaviour<T>} nameB
 * @param {recoil.frp.Behaviour<T>} textB
 * @param callback
 * @param {recoil.frp.Behaviour<T>} enabledB
 */
recoil.ui.widgets.ButtonWidget.prototype.attach = function(nameB, textB, callbackB, enabledB) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    this.enabledB = util.toBehaviour(enabledB);

    this.helper_.attach(nameB, textB, callbackB, this.enabledB);

    var me = this;
    this.changeHelper_.listen(callbackB);
};


/**
 * @private
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour} configB
 */
recoil.ui.widgets.ButtonWidget.prototype.updateConfig_ = function(helper, configB) {
    var me = this;
    var good = helper.isGood();

    if (good) {
        if (me.button_ !== null) {
            goog.dom.removeChildren(this.component_);
        }
        var config = configB.get();
        this.button_ = new goog.ui.Button(config.content, config.renderer, config.domHelper);
        this.button_.render(me.component_);
        recoil.ui.events.listen(this.button_, goog.ui.Component.EventType.ACTION, this.callback_);

        // and created a new one
        me.state_.forceUpdate();
    }
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @param callbackB
 * @param textB
 * @param enabledB
 * @private
 */
recoil.ui.widgets.ButtonWidget.prototype.updateState_ = function(helper, callbackB, textB, enabledB) {
    if (this.button_) {
        console.log('in updateState');
        this.button_.setEnabled(helper.isGood());
        if (helper.isGood()) {
          this.button_.setContent(textB.get());
          //this.button_.setEnabled(enabledB.get());

        }
    }
};
