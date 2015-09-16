goog.provide('recoil.ui.widgets.MenuBarWidget');
goog.provide('recoil.ui.widgets.MenuWidget');
goog.provide('recoil.ui.widgets.MenuItemWidget');


goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.menuBar');
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

    this.scope_ = scope;
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
};


recoil.ui.widgets.MenuBarWidget.prototype.attach = function(config, menus, enabled) {
    var util = new recoil.frp.Util(this.scope_.getFrp());
    this.menus_ = menus;
    this.config_.attach(util.getDefault(this.config, recoil.ui.widgets.MenuWidget.defaultConfig));
    this.state_.attach(this.menus_, util.getDefault(enabled, true));
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

        this.menuNode_ = goog.ui.menuBar.create();
        this.menuNode_.render(me.container_);
        recoil.ui.events.listen(this.menuNode_, goog.ui.Component.EventType.ACTION, this.callback_);
        // and created a new one
        me.state_.forceUpdate();
    }
};
/**
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour<Array<recoil.ui.Widget>>} menusB
 * @param {recoil.frp.Behaviour<Boolean>} enabledB
 */
recoil.ui.widgets.MenuBarWidget.prototype.updateState_ = function(helper, menusB, enabledB) {
    if (this.menuNode_) {
        this.menuNode_.setEnabled(/* boolean */ helper.isGood() && enabledB.get());
        var me = this;
        if (helper.isGood()) {
            console.log("adding menus really we need to do a diff here");
            goog.array.forEach(menusB.get(), function(menuWidget) {
                console.log("adding a child");
                var menu = goog.dom.createElement('div');
                menuWidget.setContainer(menu);
                me.menuNode_.addChild(menu);
            });
        }
    }
    
};


/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.MenuWidget = function (scope) {
   this.container_ = null;
   this.menu_ = null;
   this.state_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateState_);
};


recoil.ui.widgets.MenuWidget.prototype.setContainer = function (container) {
    this.state_.setContainer(container);
};

/**
 * @constructor
 */
recoil.ui.widgets.MenuItemWidget = function(scope) {
    this.container_ = null;
    /**
     * @private
     * @type goog.ui.MenuItem
     * 
     */
    this.menuItem_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, null, this, this.updateState_);
};

/**
 * 
 * @param nameB
 * @param actionB
 */

recoil.ui.widgets.MenuItemWidget.prototype.attach = function(nameB, enabledB, actionB) {
/*
    

    for ( var i in menuNames) {
        // Create the drop down menu with a few suboptions.
        var menu = new goog.ui.Menu();
        goog.array.forEach(menuOptions[i], function(label) {
            var item;
            if (label) {
                item = new goog.ui.MenuItem(label + '...');
                item.setId(label);
            } else {
                item = new goog.ui.MenuSeparator();
            }
            item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
            menu.addChild(item);
        });

        // Create a button inside menubar.
        var btn = new goog.ui.MenuButton(menuNames[i], menu);
        btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
        menubar.addChild(btn, true);
        goog.events.listen(btn, EVENTS, logEvent);
    }
    menubar.render(goog.dom.getElement('menuBarProgrammatic'));
*/
    };

recoil.ui.widgets.MenuItemWidget.prototype.updateState_ = function (nameB, enabledB, actionB) {
    
    
};
recoil.ui.widgets.MenuItemWidget.prototype.setContainer = function(container) {
    this.config_.setContainer(container);
    this.state_.setContainer(container);
};
