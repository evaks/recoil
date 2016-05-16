goog.provide('recoil.ui.widgets.CheckboxWidget');

goog.require('goog.events');
goog.require('goog.ui.Component');

/**
 * @constructor
 * @implements recoil.ui.Widget
 * @param {!recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.CheckboxWidget = function(scope) {
    this.component_ = new goog.ui.Component();
};

/**
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.CheckboxWidget.prototype.getComponent = function () {
    return this.component_;
}



