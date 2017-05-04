/**
 * a utility class that is used to update widgets based on a behaviour each time the the behaviour changes the callback
 * will be fired
 *
 * you may access the behaviour attached to the helper inside the callback
 *
 */
goog.provide('recoil.ui.ComponentWidgetHelper');
goog.provide('recoil.ui.TooltipHelper');

goog.require('goog.events.FocusHandler');
goog.require('goog.ui.Tooltip');
goog.require('recoil.frp.Frp');
goog.require('recoil.frp.VisibleObserver');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.messages');


/**
 * @template T
 * @param {!recoil.ui.WidgetScope} widgetScope gui scope
 * @param {!goog.ui.Component} component when this is no longer visible updates will longer fire and memory will be cleaned up
 * @param {Object} obj the this pointer callback will be called with
 * @param {function(...?)} callback
 * @param {function()=} opt_detachCallback
 * @constructor
 */

recoil.ui.ComponentWidgetHelper = function(widgetScope, component, obj, callback, opt_detachCallback) {
    this.observer_ = widgetScope.getObserver();
    this.frp_ = widgetScope.getFrp();
    this.component_ = component;
    this.detachCallback_ = function() {
        if (opt_detachCallback) {
            opt_detachCallback.apply(obj, []);
        }
    };
    this.debug_ = null;
    if (!(callback instanceof Function)) {
        throw new Error('callback not a function');
    }
    var me = this;
    this.listenFunc_ = function(visible) {
        if (me.debug_) {
            console.log('VISIBLE', me.debug_, visible);
        }
        if (visible != me.isAttached_) {
            me.isAttached_ = visible;
            if (visible) {
                me.frp_.attach(/** @type {!recoil.frp.Behaviour} */(me.attachedBehaviour_));
            } else {
                me.detachCallback_();
                me.frp_.detach(/** @type {!recoil.frp.Behaviour} */(me.attachedBehaviour_));
            }
        }
    };

    /**
     * @private
     * @final
     * @return {recoil.frp.BStatus}
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
     * @private
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
 * updates the classes on an elemnt it will remove all old classes that are in cur classes but not
 * in classesB
 * @param {Element} element the element to update the class list for
 * @param {!recoil.frp.Behaviour<!Array<!string>>} classesB the behaviour that stores the classes in
 * @param {!Array<!string>} curClasses
 * @return {!Array<!string>} the new classes
 */
recoil.ui.ComponentWidgetHelper.updateClasses = function(element, classesB, curClasses) {
    var newClasses = classesB.metaGet().good() ? classesB.get() : [];
        newClasses.forEach(function(cls) {
        if (curClasses.indexOf(cls) === -1) {
            goog.dom.classlist.add(element, cls);
        }
    });
    curClasses.forEach(function(cls) {
        if (newClasses.indexOf(cls) === -1) {
            goog.dom.classlist.add(element, cls);
        }
    });

    return newClasses;
};

/**
 * @return {!recoil.frp.Frp}
 */
recoil.ui.ComponentWidgetHelper.prototype.getFrp = function() {
    return this.frp_;
};
/**
 * @param {!string} debug the tag to print when debugging
 */
recoil.ui.ComponentWidgetHelper.prototype.debug = function(debug) {
    this.debug_ = debug;
};

/**
 * @return {!boolean}
 */
recoil.ui.ComponentWidgetHelper.prototype.isAttached = function() {
    return this.isAttached_;
};

/**
 * @param {!Element} node at text node that will contain the message
 */
recoil.ui.ComponentWidgetHelper.prototype.setMessage = function(node) {
    goog.dom.removeChildren(node);
    goog.dom.classlist.removeAll(node, ['recoil-error', 'recoil-info']);
    if (!this.isGood()) {
        var errors = this.errors();
        if (errors.length > 0) {
            goog.dom.append(node, goog.dom.createTextNode(recoil.ui.messages.join(errors).toString()));
            goog.dom.classlist.add(node, 'recoil-error');
        }
        else {
            goog.dom.classlist.add(node, 'recoil-notready');
            goog.dom.append(node, goog.dom.createTextNode(recoil.ui.messages.NOT_READY.toString()));
        }
    }
};
/**
 * removes all children
 */
recoil.ui.ComponentWidgetHelper.prototype.clearContainer = function() {
   this.component_.removeChildren(true);
};

/**
 * @return {!boolean} is the value good
 */
recoil.ui.ComponentWidgetHelper.prototype.isGood = function() {
    for (var key = 0; key < this.behaviours_.length; key++) {
        var b = this.behaviours_[key];
        if (!b.hasRefs()) {
            return false;
        }
        if (b.metaGet() !== null && !b.metaGet().good()) {
            return false;
        }
    }

    return true;
};

/**
 * @return {!Array<*>} an array of errors
 */
recoil.ui.ComponentWidgetHelper.prototype.errors = function() {
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
 * force the change to fire
 */
recoil.ui.ComponentWidgetHelper.prototype.forceUpdate = function() {
    if (this.behaviours_.length !== 0) {
        recoil.util.invokeOneParamAndArray(null, recoil.frp.Frp.access, this.callback_, this.behaviours_);
    }
};

/**
 * @param {...recoil.frp.Behaviour<T>} var_behaviour
 *
 * note the node we are watch must be in the dom by now, the reason for this is if it isn't and
 * is never added we will have a leak observer maintains a list that can never be cleared also once it
 * item is removed form the DOM and node re-added within the same execution thread it will be
 * considered disposed.
 *
 * this is because there are no weak references in javascript
 */

recoil.ui.ComponentWidgetHelper.prototype.attach = function(var_behaviour) {

    var newBehaviours = [];
    var same = arguments.length === this.behaviours_.length;
    for (var i = 0; i < arguments.length; i++) {
        newBehaviours.push(arguments[i]);
        same = same && arguments[i] === this.behaviours_[i];
    }
    if (same) {
        return;
    }
    var me = this;

    var hadBehaviour = this.behaviours_.length !== 0;
    if (hadBehaviour) {
        if (this.isAttached_) {
            this.frp_.detach(/** @type {!recoil.frp.Behaviour} */(this.attachedBehaviour_));
            me.detachCallback_();
        }
    }

    this.behaviours_ = newBehaviours;
    this.attachedBehaviour_ = recoil.util.invokeOneParamAndArray(this.frp_, this.frp_.observeB, this.callback_, this.behaviours_);

    if (hadBehaviour) {
        if (this.isAttached_) {
            this.frp_.attach(/** @type {!recoil.frp.Behaviour} */ (this.attachedBehaviour_));
        }
    } else {
        this.isAttached_ = false;
        if (!this.component_.getElement()) {
            this.component_.createDom();
        }
        if (me.debug_) {
            console.log('listening', me.debug_);
        }
        this.observer_.listen(this.component_.getElementStrict(), this.listenFunc_);
    }
};

/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @param {!goog.ui.Component} comp
 * @param {string|Array<string>|!goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>} type
 *     Event type or array of event types.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @template EVENTOBJ
 * @constructor
 */

recoil.ui.EventHelper = function(scope, comp, type, opt_capt) {
    this.listener_ = null;
    this.type_ = type;
    this.capt_ = opt_capt;
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, comp, null, function() {});

    if (!comp.getElement()) {
        comp.createDom();
    }
    switch (type) {
    case goog.events.EventType.CLICK:
        this.handler_ = comp;
        break;
    case goog.ui.Component.EventType.CHANGE:
        this.handler_ = comp;
        break;
    case recoil.ui.EventHelper.EL_CHANGE:
        // we have to override this because sometimes its on the component sometimes its on the
        // element
        this.handler_ = comp.getElement();
        this.type_ = goog.events.EventType.CHANGE;
        break;
    case goog.events.EventType.BLUR:
    case goog.events.EventType.PASTE:
    case goog.events.EventType.FOCUS:
    case goog.events.EventType.KEYPRESS:
    case goog.events.EventType.KEYDOWN:
    case goog.events.EventType.KEYUP:
        this.handler_ = comp.getElement();
        break;
    case goog.ui.Component.EventType.ACTION: //goog.events.EventType.ACTION:
        this.handler_ = comp;
        break;
    case goog.events.InputHandler.EventType.INPUT:
        this.handler_ = new goog.events.InputHandler(comp.getElement());
        break;
    default:
        throw new Error('Unsupported Event Type ' + type);
    }

    var me = this;
    this.func_ = function(e) {
        console.log('EVENT', e);
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
recoil.ui.EventHelper.EL_CHANGE = 'el-change';


/**
 * @param {recoil.frp.Behaviour} callback the behaviour to set with the event
 **/

recoil.ui.EventHelper.prototype.listen = function(callback) {
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


};

/**
 * This class will but the correct tooltip on the component
 * including not ready, and error messaged
 * @constructor
 * @param {!recoil.ui.WidgetScope} widgetScope gui scope
 * @param {!goog.ui.Component} component when this is no longer visible updates will longer fire and memory will be cleaned up
 */

recoil.ui.TooltipHelper = function(widgetScope, component) {
    this.behaviours_ = [];
    this.enabledB_ = null;
    this.tooltip_ = null;
    this.component_ = component;
    this.helper_ = new recoil.ui.ComponentWidgetHelper(widgetScope, component, this, this.update_, this.detach_);
};


/**
 * @param {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} enabledB
 * @param {...recoil.ui.ComponentWidgetHelper} var_helpers
 */
recoil.ui.TooltipHelper.prototype.attach = function(enabledB, var_helpers) {

    this.enabledB_ = enabledB;
    this.behaviours_ = [enabledB];
    for (var i = 1; i < arguments.length; i++) {
        var helper = arguments[i];
        for (var b = 0; b < helper.behaviours_.length; b++) {
            this.behaviours_.push(helper.behaviours_[b]);
        }
    }
    this.helper_.attach.apply(this.helper_, this.behaviours_);

};

/**
 * @private
 * @param {!recoil.ui.ComponentWidgetHelper} helper
 */
recoil.ui.TooltipHelper.prototype.update_ = function(helper) {
    var tooltip = null;
    var enabled;
    if (helper.isGood()) {
        var reason = this.enabledB_.get().reason();
        tooltip = reason === null ? null : reason.toString();
        enabled = this.enabledB_.get().val();

    }
    else {
        var errors = this.helper_.errors();
        if (errors.length > 0) {
            tooltip = recoil.ui.messages.join(errors).toString();
        }
        enabled = false;
    }
    if (!this.component_.getElement()) {
        this.component_.createDom();
    }
    if (this.tooltip_) {
        this.tooltip_.detach(this.component_.getElement());
        this.tooltip_.dispose();
    }
    if (tooltip === null) {

        this.tooltip_ = null;
    }
    else {
        this.tooltip_ = new goog.ui.Tooltip(this.component_.getElement(), tooltip);
//        this.tooltip_.setEnabled(enabled);
    }
    if (this.component_.setEnabled) {
        this.component_.setEnabled(enabled);
    }
};


/**
 * @private
 */
recoil.ui.TooltipHelper.prototype.detach_ = function() {
    if (this.tooltip_) {
        this.tooltip_.detach(this.component_.getElement());
        this.tooltip_.dispose();
        this.tooltip_ = null;
    }
};


/**
 * utility to convert a element to a control
 * @param {Node} el
 * @return {!goog.ui.Control}
 */
recoil.ui.ComponentWidgetHelper.elementToControl = function(el) {
    var c = new goog.ui.Control(el);
    c.setHandleMouseEvents(false);
    c.setAllowTextSelection(true);
    return c;
};
