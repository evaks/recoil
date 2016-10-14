goog.provide('recoil.ui.AttachableWidget');

goog.require('recoil.ui.Widget');

/**
 * @interface
 * @extends {recoil.ui.Widget}
 */
recoil.ui.AttachableWidget = function() {
};

/**
 * returns widget
 */
recoil.ui.AttachableWidget.prototype.getComponent = function() {

};

/**
 * @template T
 * @param {T} struct
 */
recoil.ui.AttachableWidget.prototype.attachStruct = function(struct) {

};
