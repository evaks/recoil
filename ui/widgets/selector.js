
goog.provide('recoil.ui.widgets.SelectorWidget');
goog.require('recoil.frp.Behaviour');
goog.require('goog.ui.Container');
goog.require('goog.ui.Control');

/**
 *
 * @param {recoil.frp.Behaviour} layoutB
 * @constructor
 */
recoil.ui.widgets.SelectorWidget = function (scope) {
      this.scope_ = scope;
      this.component_ = new goog.ui.Component();

      this.state_ = new recoil.ui.ComponentWidgetHelper(scope, this.component_, this, this.updateState_);
};

/**
 *
 * @returns {goog.ui.Component|*}
 */
recoil.ui.widgets.SelectorWidget.prototype.getComponent = function () {
      return this.component_;
};


/**
 *
 * @param {recoil.frp.Behaviour} screenB
 */
recoil.ui.widgets.SelectorWidget.prototype.attach = function (screenB) {
      this.screenB_ = screenB;
      this.state_.attach(screenB);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.SelectorWidget.prototype.updateState_ = function (helper) {
      console.log('Inside SelectorWidget updateState_');

      var screen = null;
      if (helper.isGood()) {
            screen = this.screenB_.get();
      }

      this.component_.removeChildren();
      if(screen) {
            this.component_.addChild(screen.getComponent(), true);
      }
};