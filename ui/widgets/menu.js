goog.provide('recoil.ui.widgets.MenuBarWidget');


goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.util');

goog.require('goog.ui.Menu');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.MenuBarWidget = function(scope) {
    /**
     * @type {Element}
     */
    this.container_ = null;
    /**
     * @private
     * @type goog.ui.Menu
     * 
     */
    this.menuNode_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateState_);
};

recoil.ui.widgets.MenuBarWidget.defaultConfig = {
        renderer: null,
        domHelper: null
};
/**
 * sets the assoicated container for the widget
 * 
 * @param {Element} container
 */
recoil.ui.widgets.MenuBarWidget.prototype.setContainer = function(container) {
    this.config_.setContainer(container);
    this.state_.setContainer(container);    
}
recoil.ui.widgets.MenuBarWidget.prototype.attach = function(config, menus, enabled) {

    this.menus_ = menus;
    this.config_.attach(recoil.frp.util.getDefault(config, recoil.ui.widgets.MenuWidget.defaultConfig));
    this.state_.attach(this.menus_,recoil.frp.util.getDefault(enabled, true));
};

/**
 * @private
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour} configB
 */

recoil.ui.widgets.MenuBarWidget.prototype.updateConfig_ = function(helper, configB) {
    var me = this;
    var good = helper.isGood();

    if (good) {
        if (me.menuNode_ !== null) {
            goog.dom.removeChildren(this.container_);
        }
        var config = configB.get();
        
        var menubar = ;
        var menuNames = ["File","Edit","About"];
        var menuOptions = [];
        menuOptions[0] = ['New Files', 'Open File', null, 'Exit'];
        menuOptions[1] = ['Copy', 'Paste'];
        menuOptions[2] = ['Zerg Rush!', null, 'Exit'];

        for (i in menuNames) {
          // Create the drop down menu with a few suboptions.
          var menu = new goog.ui.Menu();
          goog.array.forEach(menuOptions[i],
            function(label) {
              var item;
              if (label) {
                item = new goog.ui.MenuItem(label + '...');
                item.setId(label);
              } else {
                item = new goog.ui.MenuSeparator();
              }
              item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
              menu.addItem(item);
            });

          // Create a button inside menubar.
          var btn = new goog.ui.MenuButton(menuNames[i], menu);
          btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
          menubar.addChild(btn, true);
          goog.events.listen(btn, EVENTS, logEvent);
        }
        menubar.render(goog.dom.getElement('menuBarProgrammatic'));
      }
        this.menuNode_ = goog.ui.menuBar.create();
        this.menuNode_.render(me.container_);
        recoil.ui.events.listen(this.menus_, goog.ui.Component.EventType.ACTION, this.callback_);

        // and created a new one
        me.state_.forceUpdate();
    }
};
/**
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour<array<recoil.ui.Widget>>} menusB
 * @param {recoil.frp.Behaviour<Boolean>} enabledB 
 */
recoil.ui.widgets.MenuBarWidget.prototype.updateState_ = function(helper, menusB, enabledB) {
    if (this.menubar_) {
        this.menubar_.setEnabled(helper.isGood() && enabledB.get());
        var me = this;
        if (helper.isGood()) {
            goog.array.forEach(menusB.get(), function(menuWidget) {
                var menu = goog.dom.createDom('div');
                menuWidget.setContainer(menu);
                me.menubar_.addChild(menu);
            });        
        }
    }
};
