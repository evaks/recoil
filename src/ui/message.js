goog.provide('recoil.ui.message');
goog.provide('recoil.ui.message.BasicMessageEnum');
goog.provide('recoil.ui.message.Message');
goog.provide('recoil.ui.message.MessageEnum');

/**
 * @constructor
 * @param {!Array<!Array<string>|string|!Object|!recoil.ui.message.Message.Part>} parts
 */
recoil.ui.message.Message = function(parts) {
    /**
     * @type {!Array<!recoil.ui.message.Message.Part>}
     */
    var myParts = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part instanceof recoil.ui.message.Message.Part) {
            myParts.push(part);
        }
        else if (part instanceof Array) {
            if (part.length !== 1) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be of length 1';
            }
            myParts.push(new recoil.ui.message.Message.Part(null, part[0], null, null));
        }
        else if (part instanceof Object) {
            var keys = Object.keys(part);
            if (keys.length !== 1) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be an object with 1 entry';
            }
            if (!(part[keys[0]] instanceof Function)) {
                throw 'Parameter ' + i + ' of ' + parts + ' must be an object with formatter function';
            }
            myParts.push(new recoil.ui.message.Message.Part(null, keys[0], null, part[keys[0]]));
        }
        else {
            myParts.push(new recoil.ui.message.Message.Part(null, null, part, null));
        }

    }

    this.parts_ = myParts;

};

/**
 * partially resolve a message some paramters may still be present, this will handle, messages inside messages
 *
 * @param {!Object=} opt_data
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.Message.prototype.resolve = function(opt_data) {
    var data = opt_data || {};
    return new recoil.ui.message.Message(this.parts_.map(function(v) {return v.resolve(data);}));
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
 * @return {recoil.ui.message.Message}
 */
recoil.ui.message.Message.prototype.clone = function() {
    return this;
};

/**
 * like toString but with a : on the end (at least for english
 * @param {!Object=} opt_data
 * @return {string}
 */

recoil.ui.message.Message.prototype.toField = function(opt_data) {
    return recoil.ui.messages.FIELD.toString({'txt' : this.toString(opt_data)});
};

/**
 * turn this message into a string if parameters are not assigned
 *       they will be enclosed in {$}
 * @param {!Object=} opt_data
 * @return {string}
 */

recoil.ui.message.Message.prototype.toString = function(opt_data) {
    if (opt_data) {
        return this.resolve(opt_data).toString();
    }
    var res = [];
    for (var i = 0; i < this.parts_.length; i++) {
        res.push(this.parts_[i].toString());
    }
    return res.join('');
};

/**
 * turn this message into some kind of data structure with fromatting
 * @param {!recoil.ui.message.Message.RichTextFormatter} formatter
 * @param {!Object=} opt_data
 * @return {string}
 */

recoil.ui.message.Message.prototype.toRichText = function(formatter, opt_data) {
    if (opt_data) {
        return this.resolve(opt_data).toRichText(formatter);
    }
    var res = [];
    for (var i = 0; i < this.parts_.length; i++) {
        res.push(this.parts_[i].toRichText(formatter));
    }
    return formatter.join(res);
};

/**
 * @return {boolean}
 */
recoil.ui.message.Message.prototype.isResolved = function() {
    for (var i = 0; i < this.parts_.length; i++) {
        var part = this.parts_[i];
        if (!part.isResolved()) {
            return false;
        }
    }
    return true;
};

/**
 * @typedef {{join:function(!Array):?,format:function(string,?):?}}
 */
recoil.ui.message.Message.RichTextFormatter;

/**
 * @constructor
 * @param {?string} format indicator of what the format should be if using format e.g. bold
 * @param {?string} name name of the parameter to be resolved
 * @param {string|recoil.ui.message.Message} message text or sub message to be displayed
 * @param {?function(?):string} formatter function to format the value to be displayed
 */
recoil.ui.message.Message.Part = function(format, name, message, formatter) {
    this.format_ = format;
    this.name_ = name;
    this.message_ = message;
    this.formatter_ = formatter;
};

/**
 * @return {boolean}
 */
recoil.ui.message.Message.Part.prototype.isResolved = function() {
    if (this.name_) {
        return false;
    }
    if (this.message_ instanceof recoil.ui.message.Message) {
        return this.message_.isResolved();
    }
    return true;
};

/**
 * @param {!recoil.ui.message.Message.RichTextFormatter} formatter
 * @return {?}
 */
recoil.ui.message.Message.Part.prototype.toRichText = function(formatter) {
    if (this.message_ instanceof recoil.ui.message.Message) {
        return this.message_.toRichText(formatter);
    }
    return formatter.format(this.format_ || '', this.toString());
};


/**
 * @return {string}
 */
recoil.ui.message.Message.Part.prototype.toString = function() {
    var val = this.message_;
    if (val instanceof recoil.ui.message.Message) {
        if (!val.isResolved()) {
            return val.toString();
        }
        val = val.toString();
    }
    if (this.name_) {
        return '{$' + this.name_ + '}';
    }
    return val + '';
};


/**
 * @param {!Object} data
 * @return {!recoil.ui.message.Message.Part}
 */
recoil.ui.message.Message.Part.prototype.resolve = function(data) {
    if (this.message_ instanceof recoil.ui.message.Message) {
        var message = this.message_.resolve(data);
        return new recoil.ui.message.Message.Part(this.format_, null, message, this.formatter_);
    }
    if (this.name_ === null) {
        return this; // already resolved
    }
        if (data.hasOwnProperty(this.name_)) {
            var val = data[this.name_];
            if (val instanceof recoil.ui.message.Message) {
                return new recoil.ui.message.Message.Part(this.format_, null, val.resolve(data), this.formatter_);
            }
            return new recoil.ui.message.Message.Part(this.format_, null, this.formatter_ ? this.formatter_(val) : val, null);
        }
        // can't resolve the data is not there
        return this;
    };


/**
 * returns a structure that can be used to messages with substution
 * @param {...(!Array<string>|string|!Object)} var_parts
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.getParamMsg = function(var_parts) {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
        parts.push(arguments[i]);
    }
    return new recoil.ui.message.Message(/** @type {!Array<!Array<string>|string|!Object|!recoil.ui.message.Message.Part>}*/(parts));
};

/**
 * returns a structure that can be used to messages with substution
 * this allows parts that have formatting the object of type {value: ?, format: ?}
 * @param {...(!Array<string>|string|!Object)} var_parts
 * @return {!recoil.ui.message.Message}
 */
recoil.ui.message.getRichMsg = function(var_parts) {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
        var part = arguments[i];
        if (part && part.format !== undefined) {
            parts.push(new recoil.ui.message.Message.Part(part.format, part.name || null, part.value === undefined ? null : part.value, part.formatter || null));
        }
        else {
            parts.push(part);
        }
    }
    return new recoil.ui.message.Message(/** @type {!Array<!Array<string>|string|!Object>}*/(parts));
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
 * @param {{key:string,msg:recoil.ui.message.Message}} unknown
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
