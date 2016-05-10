goog.provide('recoil.ui.message');
goog.provide('recoil.ui.message.Message');

/**
 * @constructor
 * @param {Array<Array<string>|string>} parts
 */
recoil.ui.message.Message = function (parts) {
    this.parts_ = parts;

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part instanceof Array) {
            if (part.length !== 1) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be of length 1';
            }
        }
    }
};

/**
 * @desc partially resolve a message some paramters may still be present, this will handle, messages inside messages
 *
 * @param {!Object}
 * @return {recoil.ui.message.Message}
 */
recoil.ui.message.Message.prototype.resolve = function (data) {
    var res = [];
    var unresolved = this.resolveRec(res, data);
    return new recoil.ui.message.Message(unresolved === 0 ? [res.join('')] : res );
};


recoil.ui.message.Message.prototype.toMessage = function (message) {
    if (message instanceof recoil.ui.message.Message) {
            return message;
    }
    
    return new recoil.ui.message.Message([message]);
};

/**
 * @desc partially resolve a message some paramters may still be present, this will handle, messages inside messages
 * @private
 * @param {!Object}
 */

recoil.ui.message.Message.prototype.resolveRec_ = function (res, data) {
    var unresolved = 0;
    for (var i in this.parts_) {
        var part = this.parts_[i]; 
        if (part instanceof Array && part.length === 1) {
            var val = data[part];
            if (val instanceof recoil.ui.message.Message) {
                unresolved += val.resolveRec_(res, data);
            }
            else if (val === undefined) {
                unresolved++;
                res.push(part);
            }
            else {
                res.push(val);
            }
        }
        else {
            res.push(part);
        }

    }
    return unresolved;

};

/**
 * @desc turn this message into a string if parameters are not assigned
 *       they will be enclosed in {$}
 *
 * @param {Object}
 * @return {recoil.ui.message.Message}
 */

recoil.ui.message.Message.prototype.toString = function () {
    var res = [];
    for (var i in this.parts_) {
        var part = this.parts_[i]; 
        if (part instanceof String || typeof(part) === 'string') {
            res.push(part);
        }
        else {
            res.push('{$' + part + '}');
        }
    }
    return res.join("");
};

/**
 * @desc returns a structure that can be used to messages with substution 
 * @param {...Array<String>| String} parts
 * @return {recoil.ui.message.Message}
 */
recoil.ui.message.getParamMsg = function (var_parts) {
    return new recoil.ui.message.Message(arguments);
};
