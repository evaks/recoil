goog.provide('recoil.ui.ElementEventHelper');
goog.provide('recoil.ui.VisibleHelper');
/**
 * a utility class that is used to update widgets based on a behaviour each time the the behaviour changes the callback
 * will be fired
 *
 * you may access the behaviour attached to the helper inside the callback
 *
 */
goog.provide('recoil.ui.WidgetHelper');


goog.require('recoil.frp.BStatus');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Frp');
goog.require('recoil.ui.WidgetScope');

/**
 * @template T
 * @param {!recoil.ui.WidgetScope} widgetScope gui scope
 * @param {Element} container when this is no longer visible updates will longer fire and memory will be cleaned up
 * @param {T} obj the this pointer callback will be called with
 * @param {function(this:T, !recoil.ui.WidgetHelper,...)} callback
 * @param {function()=} opt_detachCallback
 * @constructor
 */

recoil.ui.WidgetHelper = function(widgetScope, container, obj, callback, opt_detachCallback) {
    this.observer_ = widgetScope.getObserver();
    this.frp_ = widgetScope.getFrp();
    this.component_ = container;
    var me = this;
    this.detachCallback_ = function() {
        if (opt_detachCallback) {
            opt_detachCallback.apply(obj, []);
        }
    };
    this.listenFunc_ = function(visible) {
        if (visible != me.isAttached_) {
            me.isAttached_ = visible;
            if (visible) {
                me.frp_.attach(/** @type {!recoil.frp.Behaviour} */ (me.attachedBehaviour_));
            } else {
                me.frp_.detach(/** @type {!recoil.frp.Behaviour} */ (me.attachedBehaviour_));
                me.detachCallback_();
            }
        }
    };
    this.listenFunc_.behaviours = function() {
      if (me.attachedBehaviour_) {
        return [me.attachedBehaviour_];
      }
      return [];
    };


    /**
     * @private
     * @return {recoil.frp.BStatus}
     * @final
     */
    this.callback_ = function() {
        if (me.component_ !== null) {
            recoil.util.invokeOneParamAndArray(obj, callback, me, me.behaviours_);
        }
        return new recoil.frp.BStatus(null);
    };
    /**
     * @type {!Array<!recoil.frp.Behaviour<T>>}
     * @private
     */
    this.behaviours_ = [];
    /**
     * @type {recoil.frp.Behaviour}
     * @private
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


/**
 * @return {!Array<*>} an array of errors
 */
recoil.ui.WidgetHelper.prototype.errors = function() {
    var result = [];
    for (var key = 0; key < this.behaviours_.length; key++) {
        var b = this.behaviours_[key];
        if (!b.hasRefs()) {
            continue;
        }
        var meta = b.metaGet();

        if (meta !== null) {
            var errors = meta.errors();

            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                if (result.indexOf(error) === -1) {
                    result.push(error);
                }
            }
        }
    }

    return result;
};

/**
 * remove all the cheldren
 */
recoil.ui.WidgetHelper.prototype.clearContainer = function() {
    if (this.component_ !== null) {
        goog.dom.removeChildren(this.component_);
    }
};

/**
 * @return {boolean} is the value good
 */
recoil.ui.WidgetHelper.prototype.isGood = function() {
    for (var key = 0; key < this.behaviours_.length; key++) {
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
 * @return {boolean}
 */
recoil.ui.WidgetHelper.prototype.isAttached = function() {
    return this.isAttached_;
};

/**
 * @param {...recoil.frp.Behaviour} var_behaviour
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
            this.detachCallback_();
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

/**
 * gets the value of the first attached behaviour
 * @return {?}
 */
recoil.ui.WidgetHelper.prototype.value = function() {
    if (this.behaviours_.length > 0) {
        return this.behaviours_[0].get();
    }
    return null;
};

/**
 * Note:
 *   the reason we need a container is because we attach to it, if we where to make
 *   this hidden we would no longer be listening to events for it and that would mean
 *   we could not make it visible again
 *
 * @param {!recoil.ui.WidgetScope} widgetScope gui scope
 * @param {!Element} container an item that is always visible doesn't really need to contain the items
 * @param {IArrayLike<!Element>} showElements these elements will be show when attach behaviour is true, otherwize hidden
 * @param {IArrayLike<!Element>=} opt_hideElements these elements will be hidden when attach behaviour is true, otherwize shown
 * @param {IArrayLike<!Element>=} opt_notGoodElements these elements will be shown when the behaviour is not good
 * @constructor
 */
recoil.ui.VisibleHelper = function(widgetScope, container, showElements, opt_hideElements, opt_notGoodElements) {
    this.show_ = showElements;
    this.hide_ = opt_hideElements || [];
    this.notGood_ = opt_notGoodElements || [];
    this.scope_ = widgetScope;
    this.show_.concat(this.hide_, this.notGood_).forEach(
        function(el) {
            el.style.display = 'none';
        }
    );

    this.helper_ = new recoil.ui.WidgetHelper(
        widgetScope, container, this,
        function(helper) {
            var showList = this.notGood_;

            if (helper.isGood()) {
                showList = this.visibleB_.get() ? this.show_ : this.hide_;
            }
            this.show_.concat(this.hide_, this.notGood_).forEach(
                function(el) {
                    var show = showList.indexOf(el) !== -1;
                    el.style.display = show ? '' : 'none';
                }
            );
        });
};
/**
 * @param {!recoil.frp.Behaviour<boolean>}  visible hide/show components
 */
recoil.ui.VisibleHelper.prototype.attach = function(visible) {
    this.visibleB_ = visible;
    this.helper_.attach(this.visibleB_);
};


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @param {!Element} el
 * @param {string|Array<string>|!goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>} type
 *     Event type or array of event types.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @template EVENTOBJ
 * @constructor
 */

recoil.ui.ElementEventHelper = function(scope, el, type, opt_capt) {
    this.listener_ = null;
    this.type_ = type;
    this.capt_ = opt_capt;
    this.helper_ = new recoil.ui.WidgetHelper(scope, el, null, function() {});

    switch (type) {
        case goog.events.EventType.CLICK:
            this.handler_ = el;
            break;
        case goog.ui.Component.EventType.CHANGE:
            this.handler_ = el;
            break;
        case recoil.ui.EventHelper.EL_CHANGE:
            // we have to override this because sometimes its on the component sometimes its on the
            // element
            this.handler_ = el;
            this.type_ = goog.events.EventType.CHANGE;
            break;
        case goog.events.EventType.BLUR:
        case goog.events.EventType.PASTE:
        case goog.events.EventType.FOCUS:
        case goog.events.EventType.KEYPRESS:
        case goog.events.EventType.KEYDOWN:
        case goog.events.EventType.KEYUP:
            this.handler_ = el;
            break;
        case goog.ui.Component.EventType.ACTION: //goog.events.EventType.ACTION:
            this.handler_ = el;
            break;
        case goog.events.InputHandler.EventType.INPUT:
            this.handler_ = new goog.events.InputHandler(el);
            break;
        default:
            throw new Error('Unsupported Event Type ' + type);
    }

    var me = this;
    this.func_ = function(e) {
        if (me.listener_) {
            me.listener_.frp().accessTrans(function() {
                // sometimes events fire when before it is on the screen
                if (me.helper_.isAttached()) {
                    me.listener_.set(e);
                }
            }, me.listener_);
        }
    };
};

/**
 * @final
 * @type {string}
 */
recoil.ui.ElementEventHelper.EL_CHANGE = 'el-change';


/**
 * @param {recoil.frp.Behaviour} callback the behaviour to set with the event
 **/

recoil.ui.ElementEventHelper.prototype.listen = function(callback) {
    this.helper_.attach(callback);
    if (this.listener_ !== null && callback === null) {

        this.listener_ = callback;

        goog.events.unlisten(this.handler_, this.type_, this.func_, this.capt_);
    }
    else if (this.listener_ === null && callback !== null) {
        this.listener_ = callback;
        goog.events.listen(this.handler_, this.type_, this.func_, this.capt_);
    }
    else {
        this.listener_ = callback;
    }

    this.listener_.setName('ElementEventHelperB');
};
