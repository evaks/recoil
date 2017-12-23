goog.provide('recoil.ui.layout.Card');
goog.provide('recoil.ui.layout.ComponentCard');

goog.require('goog.ui.Component');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetScope');

/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 */
recoil.ui.layout.Card = function(scope) {
    this.container_ = new goog.ui.Component();
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
            this.curControl_ = newControl;
        }
    }
    else {
        if (this.curControl_) {
            this.container_.removeChild(this.curControl_, true);
            this.curControl_ = undefined;
        }
    }
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.layout.Card.prototype.flatten = recoil.frp.struct.NO_FLATTEN;



/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 */
recoil.ui.layout.ComponentCard = function(scope) {
    this.container_ = new goog.ui.Component();
    this.curControl_ = null;
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);

};

/**
 * gets the component of the widget that should be placed in the
 * dom
 * @return {!goog.ui.Component}
 */
recoil.ui.layout.ComponentCard.prototype.getComponent = function() {
    return this.container_;
};

/**
 * @param {!recoil.frp.Behaviour<!goog.ui.Component>} subComponent
 */

recoil.ui.layout.ComponentCard.prototype.attach = function(subComponent) {
    this.helper_.attach(subComponent);
};

/**
 * @private
 * @param {recoil.ui.ComponentWidgetHelper} helper
 * @param {recoil.frp.Behaviour<goog.ui.Component>} widgetB
 */
recoil.ui.layout.ComponentCard.prototype.updateState_ = function(helper, widgetB) {
    if (helper.isGood()) {
        var newControl = widgetB.get();
        if (newControl !== this.curControl_) {
            if (this.curControl_) {
                this.container_.removeChild(this.curControl_, true);
            }
            this.container_.addChild(newControl, true);
            this.curControl_ = newControl;
        }
    }
    else {
        if (this.curControl_) {
            this.container_.removeChild(this.curControl_, true);
            this.curControl_ = undefined;
        }
    }
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.layout.ComponentCard.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
