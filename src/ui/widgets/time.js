goog.provide('recoil.ui.columns.Time');
/**
 * the inputs are value and a selected value
 *
 */
goog.provide('recoil.ui.widgets.TimeWidget');

goog.require('goog.date');
goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('goog.ui.Container');
goog.require('goog.ui.DatePicker');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.EventHelper');
goog.require('recoil.ui.TooltipHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.message.Message');
goog.require('recoil.ui.messages');
goog.require('recoil.ui.util');

/**
 *
 * @template T
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 * @constructor
 */
recoil.ui.widgets.TimeWidget = function(scope) {
    this.scope_ = scope;

    var cd = goog.dom.createDom;
    var frp = scope.getFrp();

    this.time_ = cd('input', {type: 'time'});

    this.container_ = cd('div', {class: 'budget-time-cont'}, this.time_);
    this.component_ = recoil.ui.ComponentWidgetHelper.elementToNoFocusControl(this.container_);

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.component_, this, this.updateState_);
//    this.changeHelper_ = new recoil.ui.EventHelper(scope  );
    this.tooltip_ = new recoil.ui.TooltipHelper(scope, this.component_, this.time_);
    this.rawValueB_ = frp.createB(null);
    var me = this;

    goog.events.listen(this.time_, goog.events.EventType.BLUR, function(e) {
        frp.accessTrans(function() {
            me.helper_.forceUpdate();
        }, me.valueB_, me.boundsB_);
    });
    goog.events.listen(this.time_, goog.events.EventType.CHANGE, function(e) {
        frp.accessTrans(function() {
/*            if (false) {
                return;
            }
*/
            var outTime = me.convertElTypeToTime_(me.time_.value);
            var valid = me.isValid(me.boundsB_.get(), outTime);
            goog.dom.classlist.enable(me.time_, 'recoil-error', !valid);
            if (valid) {
                me.valueB_.set(outTime);
            }
        }, me.valueB_, me.boundsB_);
    });
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */
recoil.ui.widgets.TimeWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

/**
 * @type {!recoil.frp.Util.OptionsType}
 */
recoil.ui.widgets.TimeWidget.options =
    recoil.ui.util.StandardOptions('value', {start: null, stop: null, min: null, max: null, step: 60});


/**
 * @param {!recoil.frp.Behaviour<number>|number} value the widget that will be displayed in the popup
 * @suppress {missingProperties}
 */

recoil.ui.widgets.TimeWidget.prototype.attach = function(value)  {
    recoil.ui.widgets.TimeWidget.options.value(value).attach(this);
};


/**
 * @param {!Object|!recoil.frp.Behaviour<Object>} options
 * @suppress {missingProperties}
 */
recoil.ui.widgets.TimeWidget.prototype.attachStruct = function(options) {
    var frp = this.helper_.getFrp();
    var bound = recoil.ui.widgets.TimeWidget.options.bind(frp, options);
    var me = this;

    this.valueB_ = bound.value();
    this.enabledB_ = bound.enabled();

    this.boundsB_ = bound.getGroup([bound.min, bound.max, bound.step]);
    this.helper_.attach(this.valueB_, this.enabledB_, this.boundsB_);

    this.tooltip_.attach(this.enabledB_, this.helper_);
};


/**
 * @private
 * @param {?number} time
 * @return {?string}
 */
recoil.ui.widgets.TimeWidget.prototype.convertTimeToElType_ = function(time) {
    if (time === null) {
        return null;
    }

    let secs = Math.floor((time / 1000)) % 60;
    let mins = Math.floor((time / 60000)) % 60;
    let hours = Math.floor(time / (60000 * 60)) % 24;

    secs = (secs < 10) ? '0' + secs : secs;
    mins = (mins < 10) ? '0' + mins : mins;
    hours = (hours < 10) ? '0' + hours : hours;
    return hours + ':' + mins;

};


/**
 * @private
 * @param {?string} time
 * @return {?number}
 */
recoil.ui.widgets.TimeWidget.prototype.convertElTypeToTime_ = function(time) {
    if (time == null) {
        return null;
    }
    let parts = time.split(':');
    let hours = parseInt(parts[0], 10);

    let mins = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    let secs = parts.length > 2 ? parseInt(parts[2], 10) : 0;
    return ((((hours * 60) + mins) * 60) + secs) * 1000;

};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.TimeWidget.prototype.updateState_ = function(helper) {
    if (helper.isGood()) {
        var set = function(el, prop, v) {
            if (v == null) {
                if (el.hasAttribute(prop)) {
                    el.removeAttribute(prop);
                }
            }
            else {
                if (el.getAttribute(prop) !== v) {
                    el.setAttribute(prop, v);
                }
            }
        };

        set(this.time_, 'value', this.convertTimeToElType_(this.valueB_.get()));
        set(this.time_, 'min', this.convertTimeToElType_(this.boundsB_.get().min));
        set(this.time_, 'max', this.convertTimeToElType_(this.boundsB_.get().max));
    }


};

/**
 * @param {{min: ?number, max: ?number}} bounds
 * @param {?number} value
 * @return {boolean}
 */
recoil.ui.widgets.TimeWidget.prototype.isValid = function(bounds, value) {
    return true;
};

/**
 * @param {?} d
 * @return {?}
 */
recoil.ui.widgets.TimeWidget.convertTimeToLocal = function(d) {
    return d.getFullYear() * 10000 + 100 * (d.getMonth() + 1) + d.getDate();

};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.TimeWidget.prototype.getComponent = function() {
    return this.component_;
};



/**
 * @implements {recoil.ui.widgets.table.Column}
 * @template T
 * @constructor
 * @param {!recoil.structs.table.ColumnKey} key
 * @param {!recoil.ui.message.Message|string} name
 * @param {Object=} opt_meta
 */
recoil.ui.columns.Time = recoil.ui.widgets.table.makeStructColumn(recoil.ui.widgets.TimeWidget);
