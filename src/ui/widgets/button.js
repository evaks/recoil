// contains a widget that does the rendering

goog.provide('recoil.ui.widgets.ButtonWidget');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Button');
goog.require('goog.ui.Container');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');

/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @param {boolean=} opt_long
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.ButtonWidget = function(scope, opt_long) {
    this.scope_ = scope;

    this.component_ = new goog.ui.Container();
    this.component_.createDom();
    /**
     * @private
     */
    this.button_ = new goog.ui.Button();
    this.button_.setContent('??');
    this.confirmDiv_ = goog.dom.createDom('div', {});

    this.frp_ = scope.getFrp();
    let me = this;
//    this.confirmB_ = frp.createB(0);

    this.aniId_ = null;
    this.downTime_ = null;

    this.component_.setFocusable(false);
    this.component_.getElement().setAttribute('class', 'recoil-button-tooltip-padding');
    this.component_.addChild(this.button_, true);
    this.enabledHelper_ = new recoil.ui.TooltipHelper(scope, this.button_, this.component_.getElement(), function(enabled) {});

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.button_, this, this.updateState_, function() {
        me.stopAnimation_();
    });

    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.button_, goog.ui.Component.EventType.ACTION, undefined, opt_long);

    goog.events.listen(
        this.button_.getElement(), [
            goog.events.EventType.MOUSEUP,
            goog.events.EventType.MOUSEDOWN,
            goog.events.EventType.MOUSELEAVE
        ],

        function(e) {
            me.frp_.accessTrans(
                function() {
                    if (me.confirmB_.get()) {
                        if (e.type === 'mousedown' && e.button === 0) {
                            me.startAnimation_();
                        } else if (e.type === 'mouseleave') {
                            me.stopAnimation_();
                        }
                    }

                }, me.confirmB_);
        });

};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.ButtonWidget.prototype.getComponent = function() {
    return this.component_;
};

/**
 *
 * @return {!goog.ui.Button}
 */
recoil.ui.widgets.ButtonWidget.prototype.getButton = function() {
    return this.button_;
};

//recoil.ui.widgets.ButtonWidget.prototype.attach = function(value) {
//
//    this.callback_ = recoil.frp.struct.get('callback', value);
//    this.config_.attach(recoil.frp.struct.get('config', value, recoil.ui.widgets.ButtonWidget.defaultConfig));
//    this.state_.attach(this.callback_, recoil.frp.struct.get('text', value), recoil.frp.struct.get('tooltip', value, ""), recoil.frp.struct.get('enabled',
//            value, true));
//};

/**
 * @param {recoil.frp.Behaviour<string>|string|!recoil.frp.Behaviour<!Element>|Node|!recoil.ui.message.Message} textB
 * @param {recoil.frp.Behaviour<*>} callbackB
 * @param {(!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation)=} opt_enabledB
 * @param {(!recoil.frp.Behaviour<boolean>|boolean)=} opt_editable
 */
recoil.ui.widgets.ButtonWidget.prototype.attach = function(textB, callbackB, opt_enabledB, opt_editable) {
    var options = {action: callbackB, text: textB};
    if (opt_editable !== undefined) {
        options. editable = opt_editable;
    }
    if (opt_enabledB !== undefined) {
        options.enabled = opt_enabledB;
    }
    this.attachStruct(options);
};

/**
 * starts the animation when removing
 */
recoil.ui.widgets.ButtonWidget.prototype.startAnimation_ = function() {
    let me = this;
        me.downTime_ = new Date().getTime();
        let button = me.button_.getElement();
        let dims = button.getBoundingClientRect();
        let startTime = new Date().getTime();
        let aniTime = me.confirmB_.get();

        me.stopAnimation_();
        let aniFunc = me.frp_.accessTransFunc(function(first) {
            let progress = first ? 0 : Math.min(1, (new Date().getTime() - startTime) / aniTime);

            me.confirmAniB_.get()(me.confirmDiv_, dims, progress);

            if (progress === 1 && me.aniId_ !== null) {
                clearInterval(me.aniId_);
                me.aniId_ = null;
            }

        }, me.confirmAniB_);
        aniFunc(true);
        me.aniId_ = setInterval(aniFunc, 40);
        button.appendChild(me.confirmDiv_);

    };

/**
 * stops the animation
 */
recoil.ui.widgets.ButtonWidget.prototype.stopAnimation_ = function() {
    let me = this;
    if (me.aniId_ !== null) {
        clearInterval(me.aniId_);
        me.aniId_ = null;
    }
    if (me.confirmDiv_) {
        goog.dom.removeNode(me.confirmDiv_);
    }
};

/**
 * @param {!Element} container
 * @param {{x: number, y: number, height: number, width: number}} position
 * @param {number} progress
 *
 */
recoil.ui.widgets.ButtonWidget.defaultConfirmAni = function(container, position, progress) {

    let width = 50;
    let height = 50;
    let dims = position;
    let top = Math.floor(dims.y - (width / 2) + dims.height / 2);
    let left = Math.floor(dims.x - (width / 2) + dims.width / 2);
    let redW = width * progress / 2;

    container.setAttribute('style',
                           'top:' + top + 'px;'
                           + 'left:' + left + 'px;'
                           + 'width:' + width + 'px;'
                           + 'height:' + height + 'px;');

    goog.dom.classlist.enable(container, 'recoil-button-confirm', true);

//    container.style.background = ' radial-gradient(#9ab568 0%, #9ab568 ' + redW + 'px,' + ' transparent ' + redW + 'px, transparent 49px)';
    let startColor = 'rgb(56 165 255)';
    let endColor = 'rgb(169 216 255)';

    container.style.background = ' radial-gradient(' +
        startColor + ' 0%, ' + startColor + ' ' + Math.max(0, redW - 6) + 'px, ' +
        endColor + ' ' + Math.max(0, redW - 1) + 'px, ' +
        'transparent ' + redW + 'px, transparent ' + (width / 2) + 'px)';

//    container.style.background = ' radial-gradient(green 0%, transparent ' + redW + 'px, green 49px)';

};

/**
 * the behaviours that this widget can take
 *
 * action - the callback that gets executed when
 * text - the text to display on the button
 * enabled if the button is enambed
 */
recoil.ui.widgets.ButtonWidget.options = recoil.frp.Util.Options(
    'action', 'text',
    {
        enabled: recoil.ui.BoolWithExplanation.TRUE,
        editable: true,
        classes: [],
        tooltip: null,
        confirm: 0,
        confirmAni: recoil.ui.widgets.ButtonWidget.defaultConfirmAni
    }
);

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} value
 */
recoil.ui.widgets.ButtonWidget.prototype.attachStruct = function(value) {

    var frp = this.helper_.getFrp();
    var bound = recoil.ui.widgets.ButtonWidget.options.bind(frp, value);

    var BoolWithExplanation = recoil.ui.BoolWithExplanation;
    var util = new recoil.frp.Util(frp);
    var enabledB = bound.enabled();
    var editableB = bound.editable();
    this.textB_ = bound.text();
    var callbackB = bound.action();
    this.confirmB_ = bound.confirm();
    this.confirmAniB_ = bound.confirmAni();

    var me = this;
    this.enabledB_ = BoolWithExplanation.and(
        frp,
        BoolWithExplanation.createTrueB(frp.createB(true), bound.tooltip()),
        BoolWithExplanation.createB(editableB), enabledB);

    this.callbackB_ = frp.liftBI(function(v) {
        return v;
    }, function(v) {
        me.stopAnimation_();
        if (me.enabledB_.good() && me.enabledB_.get().val()) {
            if (!me.confirmB_.get() || (me.downTime_ && (new Date().getTime() - me.downTime_) > me.confirmB_.get())) {
                callbackB.set(v);
            }
        }
        me.downTime_ = null;

    }, callbackB, this.enabledB_, this.confirmB_);

    this.classesB_ = frp.liftB(function(cls, enabled) {
        var res = [];
        if (!enabled.val()) {
            res.push('recoil-button-disabled');
        }
        res = res.concat(cls);
        return res;
    }, bound.classes(), this.enabledB_);

    this.helper_.attach(this.textB_, this.callbackB_, this.enabledB_, this.classesB_, this.confirmB_, this.confirmAniB_);
    this.enabledHelper_.attach(
        /** @type {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>} */ (this.enabledB_),
        this.helper_);
    this.changeHelper_.listen(this.callbackB_);
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour<string|!recoil.ui.message.Message|Node>} textB
 * @param {recoil.frp.Behaviour<*>} callbackB
 * @param {recoil.frp.Behaviour<recoil.ui.BoolWithExplanation>} enabledB
 * @private
 */
recoil.ui.widgets.ButtonWidget.prototype.updateState_ = function(helper, textB, callbackB, enabledB) {
    if (this.button_) {
        if (textB.good()) {
            var text = textB.get();
            if (text instanceof recoil.ui.message.Message) {
                text = text.toString();
            }
            this.button_.setContent(text);

        }
        var classes = ['recoil-button-tooltip-padding'].concat(this.classesB_.good() ? this.classesB_.get() : []);
        if (!this.helper_.isGood()) {
            classes.push('recoil-button-disabled');
        }
        this.component_.getElement().setAttribute('class', classes.join(' '));
    }
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.ButtonWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;
