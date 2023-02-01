goog.provide('recoil.ui.renderers.NullRenderer');


goog.require('recoil.ui.widgets.SelectorWidget');

/**
 * @param {string} nullStr
 * @param {function(?,boolean,!recoil.ui.BoolWithExplanation):!Element} renderer the original renderer
 * @return {function(?,boolean,!recoil.ui.BoolWithExplanation):!Element}
 */
recoil.ui.renderers.NullRenderer = function(nullStr, renderer) {
    let res = function(val, valid, enabled) {
        if (val === null) {
            return recoil.ui.widgets.SelectorWidget.RENDERER(nullStr, valid, enabled);
        }
        if (!renderer) {
            return recoil.ui.widgets.SelectorWidget.RENDERER(val, valid, enabled);
        }
        return renderer(val, valid, enabled);
    };

    recoil.util.func.makeEqualFunc(res, recoil.ui.renderers.NullRenderer, renderer);
    return res;
};
