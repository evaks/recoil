goog.provide('recoil.ui.RenderedDecorator');

/**
 * @constructor
 * @param {function() : recoil.ui.RenderedDecorator} decorator
 * @param {!Element} outer
 * @param {Element=} opt_inner
 */
recoil.ui.RenderedDecorator = function(decorator, outer, opt_inner) {
    this.inner = opt_inner || outer;
    this.outer = outer;
    this.decorator = decorator;
};
