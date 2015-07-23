/**
 * a utility class that wraps a message and its optional parameters
 * 
 * the parameter can be messages as well just strings, it allows translation of the text
 * 
 */

goog.provide('recoil.ui.Message');

/**
 * @constructor
 * @param {string} message
 * @param {Object=} opt_params
 */
recoil.ui.Message = function(message, opt_params) {
    this.message_ = message;
    this.params_ = opt_params || {};
};

/**
 * Gets the translated string as an actual string
 * 
 * @return {string}
 */
recoil.ui.Message.prototype.toString = function() {
    return goog.getMsg(this.message_, recoil.ui.Message.resolve_(this.params_));
};

/**
 * converts any messages in the params object to strings
 * 
 * @param params
 */
recoil.ui.Message.resolve_ = function(params) {
    var res = {};

    for ( var k in params) {
        var val = params[k];
        if (val instanceof recoil.ui.Message) {
            res[k] = val.toString();
        } else {
            res[k] = val;
        }
    }
    return res;
};

/**
 * puts a conjunction between the messages
 * 
 * @param {Array<!recoil.ui.Message>} messages
 * @return recoil.ui.Message
 */
recoil.ui.Message.join = function(messages) {
    if (messages.length === 0) {
        return null;
    }
    if (messages.length === 1) {
        return messages[0]
    }
    var res = messages[0];

    for (var i = 1; i < messages.length; i++) {
        res = new recoil.ui.Message('{a} and {b}', {
            a: res,
            b: messages[i]
        })
    }
    return res;
};
