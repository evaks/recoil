goog.provide('recoil.ui.widgets.PopupWidget');

goog.require('goog.dom');
goog.require('goog.positioning.AnchoredViewportPosition');
goog.require('goog.ui.Container');
goog.require('goog.ui.Popup');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.widgets.ButtonWidget');

/**
 *
 * @template T
 * @param {!recoil.ui.WidgetScope} scope
 * @implements {recoil.ui.Widget}
 * @constructor
 */
recoil.ui.widgets.PopupWidget = function(scope) {
    this.scope_ = scope;
    this.popupContainer_ = goog.dom.createDom('div');
    this.displayContainer_ = goog.dom.createDom('div', {'class' : 'goog-inline-block'});
    this.buttonContainer_ = goog.dom.createDom('div', {'class' : 'goog-inline-block'});
    this.displayAndButtonContainer_ = goog.dom.createDom('div', {'class' : 'recoil-popup-container'});


    goog.dom.append(this.displayAndButtonContainer_, this.displayContainer_);
    goog.dom.append(this.displayAndButtonContainer_, this.buttonContainer_);

    this.container_ = new goog.ui.Component();
    var toControl = recoil.ui.ComponentWidgetHelper.elementToControl;

//    this.container_.addClassName("goog-inline-block");

    this.container_.addChild(toControl(this.displayAndButtonContainer_), true);
    this.container_.addChild(toControl(this.popupContainer_), true);
    this.popup_ = new goog.ui.Popup(this.popupContainer_);
    this.button_ = new recoil.ui.widgets.ButtonWidget(scope);

    goog.dom.setProperties(this.popupContainer_, {class: 'recoil-popup'});

    this.popup_.setVisible(false);
    var me = this;
    this.buttonCallback_ = scope.getFrp().createCallback(function() {

        me.popup_.setVisible(false);
        me.popup_.setPinnedCorner(goog.positioning.Corner.TOP_LEFT); // button corner
        me.popup_.setMargin(new goog.math.Box(0, 0, 0, 0));
        me.popup_.setPosition(new goog.positioning.AnchoredViewportPosition(me.displayAndButtonContainer_,
                                                                        goog.positioning.Corner.BOTTOM_LEFT));

        me.popup_.setVisible(true);
        console.log('do it');
    });

    this.button_.getComponent().render(this.buttonContainer_);
    this.popup_.setHideOnEscape(true);
    this.popup_.setAutoHide(true);
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);
};


/**
 */
recoil.ui.widgets.PopupWidget.options = recoil.frp.Util.Options('popupWidget', 'displayWidget');

/**
 * @param {!recoil.frp.Behaviour<!recoil.ui.Widget>|!recoil.ui.Widget} popupWidget the widget that will be displayed in the popup
 * @param {!recoil.frp.Behaviour<!recoil.ui.Widget>|!recoil.ui.Widget} displayWidget the widget that will be displayed normally (no popup required
 * @suppress {missingProperties}
 */

recoil.ui.widgets.PopupWidget.prototype.attach = function(popupWidget, displayWidget)  {
    recoil.ui.widgets.PopupWidget.options.displayWidget(displayWidget).popupWidget(popupWidget).attach(this);
};


/**
 * see recoil.ui.widgets.PopupWidget.options fro valid options
 * @param {!Object|!recoil.frp.Behaviour<Object>} options
 * @suppress {missingProperties}
 */
recoil.ui.widgets.PopupWidget.prototype.attachStruct = function(options) {
    var frp = this.helper_.getFrp();
    var bound = recoil.ui.widgets.PopupWidget.options.bind(frp, options);

    this.displayWidgetB = bound.displayWidget();
    this.popupWidgetB = bound.popupWidget();

    this.button_.attach('', '...', this.buttonCallback_, recoil.ui.BoolWithExplanation.TRUE);
    this.helper_.attach(this.popupWidgetB, this.displayWidgetB);

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.PopupWidget.prototype.updateState_ = function(helper) {
    if (helper.isGood()) {
        console.log('rendering', this.displayAndButtonContainer_);
        console.log('rendering dis', this.displayContainer_);
        this.displayWidgetB.get().getComponent().render(this.displayContainer_);
        this.popupWidgetB.get().getComponent().render(this.popupContainer_);
    }
    else {
    }
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.PopupWidget.prototype.getComponent = function() {
    return this.container_;
};
