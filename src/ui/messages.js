goog.provide('recoil.ui.messages');

goog.require('recoil.ui.message');

/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.AND = recoil.ui.message.getParamMsg(['first'], ' and ', ['second']);

/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.PAGE_X_OF_Y = recoil.ui.message.getParamMsg('Page ', ['x'], ' of ', ['y']);

/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NOT_READY = recoil.ui.message.getParamMsg('Not ready');

/**
 * @type {recoil.ui.message.Message}
 * @final
 */

recoil.ui.messages.VALID = recoil.ui.message.getParamMsg('Valid');
/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID = recoil.ui.message.getParamMsg('Invalid');

/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.__UNKNOWN_VAL = recoil.ui.message.getParamMsg('?');


/**
 * @type {recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.BLANK = recoil.ui.message.getParamMsg('');


/**
 * combines multiple messages, this logic may need to be changed for different languages
 * @param {Array<recoil.ui.message.Message| *>} messages
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.messages.join = function(messages) {

    if (messages.length === 0) {
        return new recoil.ui.message.Message(['']);
    }
    if (messages.length === 1) {
        return recoil.ui.message.toMessage(messages[0]);
    }

    var first = messages[0];

    for (var i = 1; i < messages.length; i++) {
        var second = messages[i];
        first = recoil.ui.messages.AND.resolve({first: first, second: second});
    }
    return /** @type {!recoil.ui.message.Message} */ (first);
};

