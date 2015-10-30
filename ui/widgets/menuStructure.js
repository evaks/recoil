goog.provide("recoil.ui.widgets.MenuStructure");

/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.MenuStructure = function (scope) {
      this.scope_   = scope;
      this.menuArr_ = [];
};

/**
 *
 * @param {Array<string>} menus
 * @param {recoil.ui.actions.ScreenAction} screenAction
 */
recoil.ui.widgets.MenuStructure.prototype.add = function (menus, screenAction) {

      var curMenus = this.menuArr_;
      for (var i = 0; i < menus.length; i++) {
            var idx = goog.array.findIndex(curMenus, function (el) {return el.name === menus[i];});


            var menuStruct;
            if (idx === -1) {
                  menuStruct = {
                        name:  menus[i],
                        children : []
                  };
                  curMenus.push(menuStruct);
            }
            else {
                  menuStruct = curMenus[idx];
            }
            if (i + 1=== menus.length) {
                  menuStruct.action = screenAction;

            }
            curMenus = menuStruct.children;
      }
};

/**
 *
 * @param {recoil.ui.widgets.MenuButtonWidget} menu
 * @param {object} item
 * @returns {recoil.ui.widgets.MenuItemWidget}
 * @private
 */
recoil.ui.widgets.MenuStructure.prototype.create_ = function(menu, item) {
      if (item.children.length === 0) {
            console.log(item.name);
            var menuItem = new recoil.ui.widgets.MenuItemActionWidget(this.scope_);
            menuItem.attach(item.name, true, item.action.createCallback(this.scope_));
            return menuItem;
      }
      else {
            // submenu
            var subMenu = new recoil.ui.widgets.SubMenuWidget(this.scope_);


            var me = this;
            var subitems = [];
            item.children.forEach(function(it){
                  var menuItem = me.create_(menu, it);
                  subMenu.getComponent().addItem(menuItem.getComponent());
                  subitems.push(me.create_(menu, it));
            });
            subMenu.attach(item.name, true);

            return subMenu;
      }
};

/**
 *
 * @returns {recoil.frp.Behaviour<Array<recoil.ui.MenuButtonWidget>> | Array<recoil.ui.MenuButtonWidget>}
 */
recoil.ui.widgets.MenuStructure.prototype.create = function () {
      var menuArr = [];

      var me = this;
      for (var i in this.menuArr_) {
            var menu      = new recoil.ui.widgets.MenuButtonWidget(scope);
            var items = [];

            goog.array.forEach(this.menuArr_[i].children, function(item) {
                  items.push(me.create_(menu, item));

            });
            menu.attach(this.menuArr_[i].name, items);
            menuArr.push(menu);
      }
      return menuArr;
};