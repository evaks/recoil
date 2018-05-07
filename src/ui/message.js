goog.provide('recoil.ui.message');
goog.provide('recoil.ui.message.BasicMessageEnum');
goog.provide('recoil.ui.message.Message');
goog.provide('recoil.ui.message.MessageEnum');

/**
 * @constructor
 * @param {!Array<!Array<!string>|!string|!Object>} parts
 */
recoil.ui.message.Message = function(parts) {
    this.parts_ = parts;

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part instanceof Array) {
            if (part.length !== 1) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be of length 1';
            }
        }
        else if (part instanceof Object) {
            var keys = Object.keys(part);
            if (keys.length !== 1) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be an object with 1 entry';
            }
            if (!(part[keys[0]] instanceof Function)) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be an object with formatter function';
            }
        }

    }
};

/**
 * partially resolve a message some paramters may still be present, this will handle, messages inside messages
 *
 * @param {!Object=} opt_data
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.Message.prototype.resolve = function(opt_data) {
    var res = [];
    var unresolved = this.resolveRec_(res, opt_data || {});
    return new recoil.ui.message.Message(unresolved === 0 ? [res.join('')] : res);
};


/**
 * @param {*|!recoil.ui.message.Message} message
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.toMessage = function(message) {
    if (message instanceof recoil.ui.message.Message) {
            return message;
    }

    return new recoil.ui.message.Message([message]);
};

/**
 * partially resolve a message some paramters may still be present, this will handle, messages inside messages
 * @private
 * @param {Array<Array<!string>|!string|!Object>} res
 * @param {!Object} data
 * @return {number}
 */

recoil.ui.message.Message.prototype.resolveRec_ = function(res, data) {
    var unresolved = 0;
    for (var i = 0; i < this.parts_.length; i++) {
        var part = this.parts_[i];
        var formatter = null;
        var fieldName = null;
        if (!(part instanceof Array) && (part instanceof Object)) {
            fieldName = Object.keys(part)[0];
            formatter = part[fieldName];
        }
        if ((part instanceof Array && part.length === 1) || formatter) {
            var val = data[fieldName ? fieldName : part];
            if (val instanceof recoil.ui.message.Message) {
                unresolved += val.resolveRec_(res, data);
            }
            else if (val === undefined) {
                unresolved++;
                res.push(part);
            }
            else {
                res.push(formatter ? formatter(val) : val);
            }
        }
        else {
            res.push(part);
        }

    }
    return unresolved;

};
/**
 * @return {recoil.ui.message.Message}
 */
recoil.ui.message.Message.prototype.clone = function() {
    return this;
};

/**
 * turn this message into a string if parameters are not assigned
 *       they will be enclosed in {$}
 *
 * @return {string}
 */

recoil.ui.message.Message.prototype.toString = function() {
    var res = [];
    for (var i = 0; i < this.parts_.length; i++) {
        var part = this.parts_[i];
        if (part instanceof String || typeof(part) === 'string') {
            res.push(part);
        }
        else {
            res.push('{$' + part + '}');
        }
    }
    return res.join('');
};

/**
 * returns a structure that can be used to messages with substution
 * @param {...(!Array<!string>|!string|!Object)} var_parts
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.getParamMsg = function(var_parts) {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
        parts.push(arguments[i]);
    }
    return new recoil.ui.message.Message(/** @type {!Array<!Array<!string>|!string|!Object>}*/(parts));
};

/**
 * @interface
 * @template T
 */

recoil.ui.message.MessageEnum = function() {};

/**
 * @param {T} val
 * @return {!recoil.ui.message.Message}
 */

recoil.ui.message.MessageEnum.prototype.resolve = function(val) {};


/**
 * @constructor
 * @implements {recoil.ui.message.MessageEnum}
 * @template T
 * @param {!Object<T,recoil.ui.message.Message>} map
 * @param {{key:!string,msg:recoil.ui.message.Message}} unknown
 */

recoil.ui.message.BasicMessageEnum = function(map, unknown) {
    this.map_ = map;
    this.unknown_ = unknown;
};

/**
 * @param {T} val
 * @return {!recoil.ui.message.Message}
 */

recoil.ui.message.BasicMessageEnum.prototype.resolve = function(val) {
    var mesg = this.map_[val];
    if (mesg) {
        return mesg.resolve();
    }
    var vStruct = {};
    vStruct[this.unknown_.key] = val;
    return this.unknown_.msg.resolve(vStruct);
};
