goog.provide('recoil.ui.layout.Card');



/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 */
recoil.ui.layout.Card = function(scope) {
    this.container_ = new goog.ui.Container();
    this.curControl_ = null;
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);

};

/**
 * gets the component of the widget that should be placed in the
 * dom
 * @return {!goog.ui.Component}
 */
recoil.ui.layout.Card.prototype.getComponent = function() {
    return this.container_;
};

/**
 * @param {!recoil.frp.Behaviour<!recoil.ui.Widget>} subComponent
 */

recoil.ui.layout.Card.prototype.attach = function(subComponent) {
    this.helper_.attach(subComponent);
};

/**
 * @private
 * @param {recoil.ui.ComponentWidgetHelper} helper
 * @param {recoil.frp.Behaviour<recoil.ui.Widget>} widgetB
 */
recoil.ui.layout.Card.prototype.updateState_ = function(helper, widgetB) {
    if (helper.isGood()) {
        var newControl = widgetB.get().getComponent();
        if (newControl !== this.curControl_) {
            if (this.curControl_) {
                this.container_.removeChild(this.curControl_, true);
            }
            this.container_.addChild(newControl, true);
        }
    }
    else {
        if (this.curControl_) {
            this.container_.removeChild(this.curControl_, true);
        }
    }
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.layout.Card.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
