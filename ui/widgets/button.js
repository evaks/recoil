// TODO do not allow text to set the html directly
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
 * @param {Element} container the container that the tree will go into
 */
recoil.ui.widgets.ButtonWidget = function(scope, container) {
    this.container_ = container;
    /**
     * @private
     * @type goog.ui.Button
     * 
     */
    this.button_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateState_);
};

recoil.ui.widgets.ButtonWidget.defaultConfig = {
        context: null,
        renderer: null,
        domHelper: null
};

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
            goog.dom.removeChildren(this.container_);
        }
        var config = configB.get();
        this.button_ = new goog.ui.Button(config.content, config.renderer, config.domHelper);
        this.button_.render(me.container_);
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
