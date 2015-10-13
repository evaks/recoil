goog.provide('recoil.ui.widgets.MenuBarWidget');
goog.provide('recoil.ui.widgets.MenuButtonWidget');
goog.provide('recoil.ui.widgets.MenuItemWidget');


goog.require('recoil.ui.WidgetScope');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.ComponentWidgetHelper');
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
recoil.ui.widgets.MenuBarWidget = function(scope, component) {
    this.scope_ = scope;

    /**
     * @private
     * @type goog.ui.Component
     *
     */
    this.menuBar_ = goog.ui.menuBar.create();
    this.config_ = new recoil.ui.ComponentWidgetHelper(scope, this.menuBar_, this, this.updateConfig_);
    this.state_ = new recoil.ui.ComponentWidgetHelper(scope, this.menuBar_, this, this.updateState_);

};

/**
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.MenuBarWidget.prototype.getComponent = function () {
    return this.menuBar_;
};


recoil.ui.widgets.MenuBarWidget.defaultConfig = {
    renderer: null,
    domHelper: null
};

/**
 *
 * @param config
 * @param {recoil.frp.Behaviour} menus
 * @param {boolean} enabled
 */
recoil.ui.widgets.MenuBarWidget.prototype.attach = function(config, menus, enabled) {
    var util = new recoil.frp.Util(this.scope_.getFrp());
    this.menus_ = menus;
    this.config_.attach(util.getDefault(this.config, recoil.ui.widgets.MenuButtonWidget.defaultConfig));
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
        if (me.menuBar_ !== null) {

            helper.clearContainer();
        }
        var config = configB.get();

        recoil.ui.events.listen(this.menuBar_, goog.ui.Component.EventType.ACTION, this.callback_);
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
    if (this.menuBar_) {
        this.menuBar_.setEnabled(/* boolean */ helper.isGood() && enabledB.get());

        helper.clearContainer();
        var me = this;
        if (helper.isGood()) {
            console.log("adding menus really we need to do a diff here");
            goog.array.forEach(menusB.get(), function(menuWidget) {
                me.menuBar_.addChild(menuWidget.getComponent(), true);
            });
        }
    }
};


/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.MenuButtonWidget = function (scope) {
    /**
     * @private
     * @type goog.ui.MenuButton
     *
     */
    this.menuBtn_ = new goog.ui.MenuButton();
    this.scope_ = scope;
    this.state_ = new recoil.ui.ComponentWidgetHelper(scope, this.menuBtn_, this, this.updateState_);
};

/**
 * Associates a list of menu items widget with this Menu Widget
 *
 * @param {String} name the name of the menuItem
 * @param {Array<recoil.ui.widgets.MenuItemWidget>|recoil.frp.Behaviour<Array<recoil.ui.widgets.MenuItemWidget>>} menuItems
 */
recoil.ui.widgets.MenuButtonWidget.prototype.attach = function (name, menuItems) {
    this.nameB_ = this.state_.getFrp().makeBehaviour(name);
    this.itemsB_ = this.state_.getFrp().makeBehaviour(menuItems);
    this.state_.attach(this.itemsB_, this.nameB_);
};

/**
 *
 * @param helper
 * @private
 */
recoil.ui.widgets.MenuButtonWidget.prototype.updateState_ = function(helper) {
    //var menu = new goog.ui.MenuButton(this.nameB_.get(), this.menu_);
    var menu = new goog.ui.Menu();

    if (this.menuBtn_.hasChildren()) {
        this.menuBtn_.removeChildren();
    }

    if(helper.isGood()) {
        this.menuBtn_.setContent(this.nameB_.get());

        var scope = this.scope_;
        goog.array.forEach(this.itemsB_.get(), function (item) {
            menu.addChild(item.getComponent(), true);
        });

        this.menuBtn_.addChild(menu, true);
    }

};

/**
 *
 * @returns {goog.ui.MenuButton}
 */
recoil.ui.widgets.MenuButtonWidget.prototype.getComponent = function () {
    return this.menuBtn_;
};

/**
 *
 * @param scope
 * @param label
 * @constructor
 */
recoil.ui.widgets.MenuItemWidget = function(scope, label) {
    /**
     * @private
     * @type goog.ui.MenuItem
     * 
     */
    this.menuItem_ = new goog.ui.MenuItem(label);
    this.config_ = new recoil.ui.ComponentWidgetHelper(scope, this.menuItem_, this, this.updateConfig_);
    this.state_ = new recoil.ui.ComponentWidgetHelper(scope, this.menuItem_, this, this.updateState_);
};

/**
 *
 * @returns {goog.ui.MenuItem}
 */
recoil.ui.widgets.MenuItemWidget.prototype.getComponent = function () {
    return this.menuItem_;
};

/**
 *
 * @param name
 * @param enabledB
 * @param actionB
 */
recoil.ui.widgets.MenuItemWidget.prototype.attach = function(name, enabledB, actionB) {
    var util = new recoil.frp.Util(this.state_.getFrp());

    this.nameB_ = this.state_.getFrp().makeBehaviour(name);
    this.state_.attach(this.nameB_, util.toBehaviour(enabledB), actionB);
};

/**
 *
 * @param helper
 * @param nameB
 * @param enabledB
 * @param actionB
 * @private
 */
recoil.ui.widgets.MenuItemWidget.prototype.updateState_ = function (helper, nameB, enabledB, actionB) {
    console.log("in here");
};













