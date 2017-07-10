goog.provide('recoil.ui.messages');

goog.require('recoil.ui.message');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.AND = recoil.ui.message.getParamMsg(['first'], ' and ', ['second']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.PAGE_X_OF_Y = recoil.ui.message.getParamMsg('Page ', ['x'], ' of ', ['y']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NOT_READY = recoil.ui.message.getParamMsg('Not ready');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */

recoil.ui.messages.VALID = recoil.ui.message.getParamMsg('Valid');
/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID = recoil.ui.message.getParamMsg('Invalid');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NUMBER_NOT_IN_RANGE = recoil.ui.message.getParamMsg('Must be between ', ['min'], ' and ', ['max']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NUMBER_NOT_IN_RANGE_STEP = recoil.ui.message.getParamMsg('Must be between ', ['min'], ' and ', ['max'], ', step size ', ['step']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX = recoil.ui.message.getParamMsg('Min: ', ['min'], ', Max: ', ['max']);


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX_STEP = recoil.ui.message.getParamMsg('Min: ', ['min'], ', Max: ', ['max'], ', Step: ', ['step']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID_VALUE = recoil.ui.message.getParamMsg('Invalid Value');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.__UNKNOWN_VAL = recoil.ui.message.getParamMsg('?');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID_CHARACTER = recoil.ui.message.getParamMsg('Invalid Character');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE_AT_LEAST_0_CHARACTORS = recoil.ui.message.getParamMsg('Must be at least ', ['n'], 'character long.');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MAX_LENGTH_0 = recoil.ui.message.getParamMsg('Maximum Length ', ['len'], '.');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID_LENGTH = recoil.ui.message.getParamMsg('Invalid Length');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.BLANK = recoil.ui.message.getParamMsg('');


/**
 * combines multiple messages, this logic may need to be changed for different languages
 * @param {Array<recoil.ui.message.Message| *>} messages
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.messages.join = function(messages) {
    var first = new recoil.ui.message.Message(['']);
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        if (msg && msg.toString() !== '') {
            first = msg;
            break;
        }
    }
    i++;

    for (; i < messages.length; i++) {
        var second = messages[i];
        if (second && second.toString() !== '') {
            first = recoil.ui.messages.AND.resolve({first: first, second: second});
        }
    }
    return /** @type {!recoil.ui.message.Message} */ (first);
};

