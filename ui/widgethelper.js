/**
 * a utility class that is used to update widgets based on a behaviour each time the the behaviour changes the callback
 * will be fired
 *
 * you may access the behaviour attached to the helper inside the callback
 *
 */
goog.provide('recoil.ui.WidgetHelper');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.VisibleObserver');
goog.require('recoil.ui.WidgetScope');

/**
 * @template T
 * @param {!recoil.ui.WidgetScope} widgetScope gui scope
 * @param {Node} container when this is no longer visible updates will longer fire and memory will be cleaned up
 * @param {Object} obj the this pointer callback will be called with
 * @param {function(recoil.ui.WidgetHelper,...)} callback
 * @constructor
 */

recoil.ui.WidgetHelper = function(widgetScope, container, obj, callback) {
    this.observer_ = widgetScope.getObserver();
    this.frp_ = widgetScope.getFrp();
    this.component_ = container;
    var me = this;
    this.listenFunc_ = function(visible) {
        if (visible != me.isAttached_) {
            me.isAttached_ = visible;
            if (visible) {
                me.frp_.attach(/** @type {!recoil.frp.Behaviour} */ (me.attachedBehaviour_));
            } else {
                me.frp_.detach(/** @type {!recoil.frp.Behaviour} */ (me.attachedBehaviour_));
            }
        }
    };

    /**
     * @private
     * @final
     */
    this.callback_ = function() {
        if (me.component_ !== null) {
            recoil.util.invokeOneParamAndArray(obj, callback, me, me.behaviours_);
        }
    };
    /**
     * @type {Array<!recoil.frp.Behaviour<T>>}
     * @private
     */
    this.behaviours_ = [];
    /**
     * @type {recoil.frp.Behaviour}
     */
    this.attachedBehaviour_ = null;
    /**
     * @private
     * @type {boolean}
     */
    this.isAttached_ = false;
};

/**
 * @param {Node} container new container to watch the old one will no longer be observed
 */

recoil.ui.WidgetHelper.prototype.setComponent = function(container) {
    if (this.component_ === container) {
        return;
    }

    if (this.component_) {
        this.observer_.unlisten(this.component_, this.listenFunc_);
    }
    this.component_ = container;
    if (this.component_) {
        this.observer_.listen(this.component_, this.listenFunc_);
    }

};

recoil.ui.WidgetHelper.prototype.clearContainer = function() {
    if (this.component_ !== null) {
        goog.dom.removeChildren(this.component_);
    }
};

/**
 * @return {!boolean} is the value good
 */
recoil.ui.WidgetHelper.prototype.isGood = function() {
    for (var key  = 0; key < this.behaviours_.length; key++) {
        if (!this.behaviours_[key].metaGet().good()) {
            return false;
        }
    }

    return true;
};

/**
 * force the change to fire
 */
recoil.ui.WidgetHelper.prototype.forceUpdate = function() {
    if (this.behaviours_.length !== 0) {
        recoil.util.invokeOneParamAndArray(null, recoil.frp.Frp.access, this.callback_, this.behaviours_);
    }
};

/**
 * @param {...recoil.frp.Behaviour<T>} var_behaviour
 *
 * note the node we are watch must be in the dom by now, the reason for this is if it isn't and is never added we will
 * have a leak observer maintains a list that can never be cleared also once it item is removed form the DOM and node
 * re-added within the same execution thread it will be considered disposed.
 *
 * this is because there are no weak references in javascript
 */

recoil.ui.WidgetHelper.prototype.attach = function(var_behaviour) {

    var newBehaviours = [];
    var same = arguments.length === this.behaviours_.length;
    for (var i = 0; i < arguments.length; i++) {
        newBehaviours.push(arguments[i]);
        same = same && arguments[i] === this.behaviours_[i];
    }
    if (same) {
        return;
    }

    var hadBehaviour = this.behaviours_.length !== 0;
    if (hadBehaviour) {
        if (this.isAttached_) {
            this.frp_.detach(/** @type {!recoil.frp.Behaviour} */(this.attachedBehaviour_));
        }
    }

    var me = this;
    this.behaviours_ = newBehaviours;
    this.attachedBehaviour_ = recoil.util.invokeOneParamAndArray(this.frp_, this.frp_.metaLiftB, this.callback_, this.behaviours_);

    if (hadBehaviour) {
        if (this.isAttached_) {
            this.frp_.attach(/** @type {!recoil.frp.Behaviour} */(this.attachedBehaviour_));
        }
    } else {
        this.isAttached_ = false;
        if (this.component_ !== null) {
            this.observer_.listen(this.component_, this.listenFunc_);
        }
    }
};
