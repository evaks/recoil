goog.provide('recoil.ui.WidgetScope');

goog.require('recoil.frp.DomObserver');
goog.require('recoil.frp.Frp');

/**
 * @param {!recoil.frp.Frp=} opt_frp
 * @param {!recoil.frp.DomObserver=} opt_observer
 * @constructor
 */
recoil.ui.WidgetScope = function(opt_frp, opt_observer) {
    this.frp_ = opt_frp || new recoil.frp.Frp();
    this.observer_ = opt_observer || recoil.frp.DomObserver.instance;
    var frp = this.frp_;
    this.observer_.setTransactionFunc(function (callback) {
        frp.tm().doTrans(callback);
    });
};

/**
 *
 * @return {!recoil.frp.Frp}
 */
recoil.ui.WidgetScope.prototype.getFrp = function() {
    return this.frp_;
};

/**
 *
 * @return {!recoil.frp.DomObserver}
 */
recoil.ui.WidgetScope.prototype.getObserver = function() {
    return this.observer_;
};
