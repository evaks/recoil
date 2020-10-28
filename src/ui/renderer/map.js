goog.provide('recoil.ui.renderers.MapRenderer');

goog.require('recoil.ui.widgets.SelectorWidget');
goog.require('recoil.util.object');


/**
 * @param {Object} map
 * @param {!recoil.ui.message.Message=} opt_null
 * @return {function(?,boolean,!recoil.ui.BoolWithExplanation):!Element}
 */
recoil.ui.renderers.MapRenderer = function(map, opt_null) {

    return function(val, valid, enabled) {
        for (var k in map) {
            if (recoil.util.object.isEqual(map[k], val)) {
                return recoil.ui.widgets.SelectorWidget.RENDERER(k, valid, enabled);
            }
        }
        if (opt_null !== undefined && val === null) {
            return recoil.ui.widgets.SelectorWidget.RENDERER(goog.dom.createDom('em', {}, opt_null.toString()), valid, enabled);
        }
        if (valid && !enabled && (val === null || val === undefined)) {
            return recoil.ui.widgets.SelectorWidget.RENDERER('', valid, enabled);
        }
        return recoil.ui.widgets.SelectorWidget.RENDERER('Invalid ' + JSON.stringify(val), valid, enabled);
    };
};
