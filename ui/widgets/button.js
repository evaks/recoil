goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('recoil.ui.WidgetScope');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 * @param {Element} container the container that the tree will go into
 */
recoil.ui.widgets.ButtonWidget = function (scope, container) {
    this.container_ = container;
    /**
     * @private
     * @type goog.ui.Button
     * 
     */
    this.button_ = null;
    /**
     * @private
     * @type recoil.structs.Tree
     */
    this.config_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateState_);    
};

recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {

    this.callback_ = recoil.frp.struct.get('callback', value);
    this.config_.attach(recoil.frp.struct.get('config', value, goog.ui.tree.TreeControl.defaultConfig));
    this.state_.attach(this.callback_,
        recoil.frp.struct.get('text', value), 
        recoil.frp.struct.get('tooltip', value, ""),
        recoil.frp.struct.get('enabled', value, true));

};

recoil.ui.widgets.ButtonWidget.updateConfig_ = function(helper, configB) {
    var me = this;
    var good = helper.isGood();

    if (good) {
        if (me.button_ !== null) {
            goog.dom.removeChildren(this.container_);
        }
        var config = configB.get();
        this.button_ = new goog.button.Button(config.content, config.renderer, config.domHelper);
        this.button_.render(me.container_);                                                      
        goog.events.listen(this.button_, goog.ui.Component.EventType.ACTION,
              function(e) {
                me.set(e);
        });      
        // and created a new one
        me.state_.forceUpdate();
    }
};


recoil.ui.widgets.ButtonWidget.updateState_ = function(helper, callbackB, textB, tooltipB, enabledB) {
    if (this.button_) {
      this.button_.setEnabled(helper.isGood())
    }
};
