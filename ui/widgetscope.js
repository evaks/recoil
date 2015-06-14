goog.provide('recoil.ui.WidgetScope');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.VisibleObserver');

/**
 * @param {!recoil.frp.Frp=} opt_frp
 * @param {!recoil.frp.VisibleObserver=} opt_observer
 * @constructor
 */
recoil.ui.WidgetScope = function(opt_frp, opt_observer) {
    this.frp_ = opt_frp  || new recoil.frp.Frp();
    this.observer_ = opt_observer || new recoil.frp.VisibleObserver();
};

/**
 * 
 * @return !recoil.frp.Frp
 */
recoil.ui.WidgetScope.prototype.getFrp = function() {
    return this.frp_;
};

/**
 * 
 * @return !recoil.frp.VisibleObserver
 */
recoil.ui.WidgetScope.prototype.getObserver = function() {
    return this.observer_;
}
