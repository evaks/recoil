goog.provide('recoil.db.Path');
goog.provide('recoil.db.PathItem');

goog.require('goog.string');
goog.require('goog.structs.AvlTree');
/**
 * @interface
 */
recoil.db.PathItem = function() {
};


/**
 * @param {*} value
 * @param {function(*)} func
 */

recoil.db.PathItem.prototype.forEach = function(value, func) {};

/**
 * @dict
 */
recoil.db.PathItem.FACTORY = {};
/**
 * adds an item so that you can use strings to construct a path
 * @param {!string} prefix the name to be used inside []
 * @param {*} type the class of the item to use, it can take any arguments thes will be the
 *            string that is passed minus the first part, and split on space
 */
recoil.db.PathItem.addDefaultType = function(prefix, type) {
    recoil.db.PathItem.FACTORY[prefix] = type;
};

/**
 * really it is an array of path items, but for convenience sake we allow
 * specifing the path as strings
 *
 * special symbols will specify what type of path items they are
 * all symbols begin with a *
 * here are the build in ones
 * [#] every item in an array (keyed by index)
 * [# k1 k2] every item in an array (keyed by fields)
 * [obj]   every item in an object
 * [map]   every item in an avl tree
 *
 *  you may specify more tems by calling recoil.db.PathItem.addDefaultType
 *
 * @param {Array<!recoil.db.PathItem|!string>} parts
 * @constructor
 */
recoil.db.Path = function(parts) {
    this.elements_ = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (goog.isString(part)) {
            if (goog.string.startsWith(part, '[') && goog.string.endsWith(part, ']')) {
                var cleanPath = part.substring(1, part.length - 1);
                var keyParts = /** @type Array<?string> */(cleanPath.split(' '));
                var type = recoil.db.PathItem.FACTORY[keyParts[0]];

                if (type) {
                    keyParts[0] = null;
                    this.elements_.push(new (type.bind.apply(type, keyParts)));
                }
                else {
                    throw part + ' starts with a [ ends with a ] but does not have a constructor';
                }
            }
            else {
                this.elements_.push(new recoil.db.Path.Item(/** @type string */ (part)));
            }
        }
        else {
            this.elements_.push(part);
        }
    }
};

/**
 * calls func for each node that matches the path
 * @param {Object} value
 * @param {function(*, !IArrayLike<*>)} func first is the object second
 * is the parents
 * @param {number=} opt_start the depth of the path to start on
 * @param {Array<*>=} opt_parents
 */
recoil.db.Path.prototype.forEach = function(value, func, opt_start, opt_parents) {
    opt_start = opt_start || 0;
    opt_parents = opt_parents || [];

    var me = this;
    if (opt_start < this.elements_.length) {
        var item = this.elements_[opt_start];
        if (!value) {
            return;
        }
        var parents = goog.array.clone(opt_parents);
        parents.push(value);
        item.forEach(value, function(subValue) {
            me.forEach(subValue, func, opt_start + 1, parents);
        });

    }
    else {
        func(value, opt_parents);
    }
};

/**
 * calls func for each node that matches the path
 * @param {Object} value
 * @param {function(*, *, !IArrayLike<*>)} func first is the object second
 * is the parents
 * @param {number=} opt_start the depth of the path to start on
 * @param {Array<*>=} opt_parents array of parent objects
 * @private
 */
recoil.db.Path.prototype.forEachParent_ = function(value, func, opt_start, opt_parents) {
    opt_start = opt_start || 0;
    opt_parents = opt_parents || [];

    var me = this;
    if (opt_start < this.elements_.length - 1) {
        var item = this.elements_[opt_start];
        if (!value) {
            return;
        }
        var parents = goog.array.clone(opt_parents);
        parents.push(value);
        item.forEach(value, function(subValue) {
            me.forEachParent_(subValue, func, opt_start + 1);
        });

    }
    else if (opt_start == this.elements_.length - 1) {
        func(this.elements_[opt_start], value, opt_parents);
    }
};


/**
 * clears the object at the path ready for new objects be put in
 * @param {!Object} object
 * @param {function(!IArrayLike<*>):!boolean} check used to we should run on this parent
 */
recoil.db.Path.prototype.reset = function(object, check) {
    this.forEachParent_(object, function(part, value, parents) {
        if (check(parents)) {
            part.reset(value);
        }
    });
};


/**
 * puts an item at the the path
 * @param {!Object} object
 * @param {*} key
 * @param {*} val
 * @param {function(!IArrayLike<*>):!boolean} check used to we should run on this parent
 */
recoil.db.Path.prototype.put = function(object, key, val, check) {
    this.forEachParent_(object, function(part, value, parents) {
        if (check(parents)) {
            part.put(value, key, val);
        }
    });

};

/**
 * puts an item at the the path
 * @param {!Object} object
 * @param {*} key
 * @param {function(!IArrayLike<*>):!boolean} check used to we should run on this parent
 * @return {*}
 */
recoil.db.Path.prototype.get = function(object, key, check) {
    var val = recoil.db.error.NOT_PRESENT;
    this.forEachParent_(object, function(part, value, parents) {
        if (check(parents)) {
            val = part.get(value, key);
        }
    });
    return val;
};


/**
 * this indicated that we should get every item in an array
 *
 * @constructor
 * @param {...!string} var_fields the key fields of the object it contains
 * @implements recoil.db.PathItem
 */
recoil.db.Path.Array = function(var_fields) {
    if (arguments.length === 0) {

        this.lookup_ = {
            get: function(arr, idx) {
                if (idx < 0 || idx >= arr.length) {
                    return recoil.db.error.NOT_PRESENT;
                }
                return arr[idx];
            }
        };
    }
    else {
        var args = arguments;
        this.lookup_ = {
            get: function(arr, obj) {
                for (var i = 0; i < arr.length; i++) {
                    var cur = arr[i];
                    for (var j = 0; j < args.length; j++) {
                        var k = args[j];
                        if (recoil.util.object.isEqual(cur[k], obj[j])) {
                            return cur;
                        }
                    }
                }
                return recoil.db.error.NOT_PRESENT;
            }
        };
    }
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Array.prototype.forEach = function(value, callback) {
    for (var i = 0; i < value.length; i++) {
        callback(value[i]);
    }
};
/**
 * clears out the container so that items can be placed in it
 * @param {Object} parent
 */
recoil.db.Path.Array.prototype.reset = function(parent) {
    parent.length = 0;
};


/**
 * put the value into the parent object with the key
 * @param {Object} parent
 * @param {*} key
 * @param {?} val
 */
recoil.db.Path.Array.prototype.put = function(parent, key, val) {
    parent.push(val);
};

/**
 * @param {Object} parent the container
 * @param {*} key
 * @return {*}
 */
recoil.db.Path.Array.prototype.get = function(parent, key) {
    return this.lookup_.get(parent, key);
};


/**
 * every item in the avl tree
 * @implements recoil.db.PathItem
 * @constructor
 */
recoil.db.Path.Avl = function() {
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Avl.prototype.forEach = function(value, callback) {
    value.inOrderTraverse(callback);
};

/**
 * clears out the container so that items can be placed in it
 * @param {Object} parent
 */
recoil.db.Path.Avl.prototype.reset = function(parent) {
    parent.clear();
};

/**
 * put the value into the parent object with the key
 * @param {Object} parent
 * @param {*} key
 * @param {?} val
 */
recoil.db.Path.Avl.prototype.put = function(parent, key, val) {
        parent.add(val);
};

/**
 * @param {Object} parent the container
 * @param {*} key
 */
recoil.db.Path.Avl.prototype.get = function(parent, key)  {
    throw 'not inmplemented yet';

//    return recoil.db.error.NOT_PRESENT;
};



/**
 * basic item get it by name
 * @constructor
 * @param {!string} name the name of the item
 */
recoil.db.Path.Item = function(name) {
    this.name_ = name;
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Item.prototype.forEach = function(value, callback) {
    callback(value[this.name_]);
};



/**
 * clears out the container so that items can be placed in it
 * @param {Object} parent
 */
recoil.db.Path.Item.prototype.reset = function(parent) {
};

/**
 * put the value into the parent object with the key
 * @param {Object} parent
 * @param {*} key
 * @param {?} val
 */
recoil.db.Path.Item.prototype.put = function(parent, key, val) {
    parent[this.name_] = val;
};


/**
 * every item in the the object
 * @constructor
 * @implements recoil.db.PathItem
 */
recoil.db.Path.Object = function() {
};


/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Object.prototype.forEach = function(value, callback) {
    for (var key in value) {
        callback(value[key]);
    }
};

/**
 * put the value into the parent object with the key
 * @param {Object} parent
 * @param {*} key
 * @param {?} val
 */
recoil.db.Path.Object.prototype.put = function(parent, key, val) {
    parent[key] = val;
};

recoil.db.PathItem.addDefaultType('#', recoil.db.Path.Array);
recoil.db.PathItem.addDefaultType('map', recoil.db.Path.Avl);
recoil.db.PathItem.addDefaultType('obj', recoil.db.Path.Object);

