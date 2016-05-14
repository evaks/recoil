goog.provide('recoil.ui.messages');

goog.require('recoil.ui.message');


recoil.ui.messages.AND = recoil.ui.message.getParamMsg(['first'],' and ', ['second']);
recoil.ui.messages.NOT_READY = recoil.ui.message.getParamMsg('Not ready');



/**
 * @desc combines multiple messages, this logic may need to be changed for different languages
 * @param {Array<recoil.ui.message.Message| *>} messages
 * @return {!recoil.ui.message.Message}
 */

recoil.ui.messages.join = function (messages) {

    if (messages.length === 0) {
        return new recoil.ui.message.Message(['']);
    }
    if (messages.length === 1) {
        return recoil.ui.message.toMessage(messages[0]);
    }

    var first = messages[0];

    for (var i = 1; i <messages.length; i++) {
        var second = messages[i];
        first = recoil.ui.messages.AND.resolve({first: first, second : second});
    }
    return /** @type {!recoil.ui.message.Message} */ (first);
};

