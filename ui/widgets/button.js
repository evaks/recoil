// contains a widget that does the rendering

goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.frp.Behaviour');
goog.require('goog.ui.Button');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.ButtonWidget = function(scope) {
    /**
     * @type {Element}
     */
    this.component_ = null;
    /**
     * @private
     * @type goog.ui.Button
     * 
     */
    this.button_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateState_);
};

recoil.ui.widgets.ButtonWidget.defaultConfig = {
        context: null,
        renderer: null,
        domHelper: null
};
/**
 * sets the assoicated container for the widget
 * 
 * @param {Element} container
 */
recoil.ui.widgets.ButtonWidget.prototype.setComponent = function(container) {
    this.config_.setComponent(container);
    this.state_.setComponent(container);
}
recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {

    this.callback_ = recoil.frp.struct.get('callback', value);
    this.config_.attach(recoil.frp.struct.get('config', value, recoil.ui.widgets.ButtonWidget.defaultConfig));
    this.state_.attach(this.callback_, recoil.frp.struct.get('text', value), recoil.frp.struct.get('tooltip', value, ""), recoil.frp.struct.get('enabled',
            value, true));
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

recoil.ui.widgets.ButtonWidget.prototype.updateState_ = function(helper, callbackB, textB, tooltipB, enabledB) {
    if (this.button_) {
        this.button_.setEnabled(helper.isGood());
        if (helper.isGood()) {
          this.button_.setContent(textB.get());
          this.button_.setTooltip(tooltipB.get());
          this.button_.setEnabled(enabledB.get());
        
        }
    }
};
