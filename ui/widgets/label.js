/**
 * a simple widget to provide just text no formatting
 * 
 */   
goog.provide('recoil.ui.widgets.LabelWidget');

goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 * @param {Element} container the container that the tree will go into
 */
recoil.ui.widgets.LabelWidget = function(scope, container) {
    this.container_ = container;
    /**
     * @private
     * @type goog.ui.Menu
     * 
     */
    this.label_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateState_);
};

recoil.ui.widgets.LabelWidget.defaultConfig = {
        context: null,
        renderer: null,
        domHelper: null
};

recoil.ui.widgets.LabelWidget.prototype.attach = function(value) {
    this.config_.attach(recoil.frp.struct.get('config', value, recoil.ui.widgets.ButtonWidget.defaultConfig));
    this.state_.attach(recoil.frp.struct.get('text', value), recoil.frp.struct.get('tooltip', value, ""), recoil.frp.struct.get('enabled',
            value, true));
};

/**
 * @private
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour} configB
 */

recoil.ui.widgets.LabelWidget.prototype.updateConfig_ = function(helper, configB) {
    var me = this;
    var good = helper.isGood();

    if (good) {
        if (me.button_ !== null) {
            goog.dom.removeChildren(this.container_);
        }
        var config = configB.get();
        this.label_ = new goog.ui.Button(config.content, config.renderer, config.domHelper);
        this.label_.render(me.container_);
        recoil.ui.events.listen(this.button_, goog.ui.Component.EventType.ACTION, this.callback_);

        // and created a new one
        me.state_.forceUpdate();
    }
};

recoil.ui.widgets.LabelWidget.prototype.updateState_ = function(helper, callbackB, textB, tooltipB, enabledB) {
    if (this.label_) {
        this.label_.setEnabled(helper.isGood());
        this.label_.setContent(textB.isGood() ? textB.get() :"");
        if (helper.isGood()) {
          this.label_.setTooltip(tooltipB.get());
          this.label_.setEnabled(enabledB.get());
        }
    }
};


