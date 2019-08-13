/**
 *
 */

goog.provide('recoil.ui.util');

goog.require('recoil.frp.Util');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.message');

/**
 * @see recoil.frp.Util.Options
 * like the frp util option but puts in some standard options by default
 *
 * the following are the current opptions that are added,editable
 *   enabled recoil.ui.BoolWithExplanation the reason this is a boolwith explanation, is that I want the user to be reminded to think
 *     about providing the users a reason as to why something is disabled
 *   tooltip recoil.ui.message type the reason this is a message and not a string, is because I want to force, the user to use a message
 *     for language portablity
 *
 *
 * @param {...(string|!Object)} var_options
 * @return {!recoil.frp.Util.OptionsType} this has dynamic fields based on the parameters, and struct, attach, and bind function
 *
 */
recoil.ui.util.StandardOptions = function(var_options) {
    var args = [{
        editable: true,
        tooltip: recoil.ui.messages.BLANK,
        enabled: recoil.ui.BoolWithExplanation.TRUE,
        spellcheck: true}];

    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return recoil.frp.Util.Options.apply(null, args);
};


