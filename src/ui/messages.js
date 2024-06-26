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
recoil.ui.messages.OR = recoil.ui.message.getParamMsg(['first'], ' or ', ['second']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.FIELD = recoil.ui.message.getParamMsg(['txt'], ':');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NOT_APPLICABLE = recoil.ui.message.getParamMsg('N/A');

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

recoil.ui.messages.NONE = recoil.ui.message.getParamMsg('None');

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
recoil.ui.messages.MUST_BE_RANGE_STEP = recoil.ui.message.getParamMsg('Must be between ', ['ranges'], ', step size ', ['step']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE_RANGE = recoil.ui.message.getParamMsg('Must be between ', ['ranges']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE = recoil.ui.message.getParamMsg('Must be ', ['ranges']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE_STEP = recoil.ui.message.getParamMsg('Must be ', ['ranges'], ', step size ', ['step']);


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE_DISTINCT = recoil.ui.message.getParamMsg('Must be of value: ', ['mesg']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NO_VALID_RANGES = recoil.ui.message.getParamMsg('No Valid Ranges. ', ['mesg']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX = recoil.ui.message.getParamMsg('Min: ', ['min'], ', Max: ', ['max']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX_RANGES = recoil.ui.message.getParamMsg('In: ', ['ranges']);


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX_STEP = recoil.ui.message.getParamMsg('Min: ', ['min'], ', Max: ', ['max'], ', Step: ', ['step']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_TO_MAX = recoil.ui.message.getParamMsg(['min'], ' to ', ['max']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MIN_MAX_RANGES_STEP = recoil.ui.message.getParamMsg('In: ', ['ranges'], ', Step: ', ['step']);

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
recoil.ui.messages.UNKNOWN_VAL = recoil.ui.message.getParamMsg('Unknown ', ['val']);

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID_CHARACTER = recoil.ui.message.getParamMsg('Invalid Character');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.MUST_BE_AT_LEAST_0_CHARACTORS = recoil.ui.message.getParamMsg('Must be at least ', ['n'], ' character long.');

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
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NOT_SPECIFIED = recoil.ui.message.getParamMsg('Not Specified');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.INVALID_EXPRESSION = recoil.ui.message.getParamMsg('Invalid Expression');


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.NEXT = recoil.ui.message.getParamMsg('Next');


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.PREVIOUS = recoil.ui.message.getParamMsg('Previous');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.FINISH = recoil.ui.message.getParamMsg('Finish');


/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.TRAFFIC_CLASS = recoil.ui.message.getParamMsg('Traffic Class');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.UNCHANGED = recoil.ui.message.getParamMsg('unchanged');

/**
 * @type {!recoil.ui.message.Message}
 * @final
 */
recoil.ui.messages.DEFAULT = recoil.ui.message.getParamMsg('Default');

/**
 * combines multiple messages, this logic may need to be changed for different languages
 * @param {Array<recoil.ui.message.Message| *>} messages
 * @param {recoil.ui.message.Message=} opt_joiner
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.messages.join = function(messages, opt_joiner) {
    var joiner = opt_joiner || recoil.ui.messages.AND;
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
            first = joiner.resolve({first: first, second: second});
        }
    }
    return /** @type {!recoil.ui.message.Message} */ (first);
};

