goog.provide('recoil.db.Path');
goog.provide('recoil.db.PathItem');

goog.require('goog.structs.AvlTree');

/**
 * @interface
 */
recoil.db.PathItem = function () {
};


/**
 * @param {*} value
 * @param {function(*)} func 
 */

recoil.db.PathItem.prototype.forEach = function (value, func) {};

/**
 * @type Map<String,*>  
 */
recoil.db.PathItem.FACTORY = {};
/**
 * adds an item so that you can use strings to construct a path
 * @param {!String} prefix the name to be used inside []
 * @param {*} type the class of the item to use, it can take any arguments thes will be the
 *            string that is passed minus the first part, and split on space
 */
recoil.db.PathItem.addDefaultType =  function (prefix, type) {
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
 * @param {Array<!recoil.db.PathItem|!recoil.db.String>} var_parts
 * @constructor
 */
recoil.db.Path = function (parts) {
    this.elements_ = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.startsWith && part.endsWith && part.substring ) {
            if (part.startsWith("[") && part.endsWith("]")) {
                var cleanPath = part.substring(1, part.length - 1);
                var keyParts = cleanPath.split(" ");
                var type = recoil.db.PathItem.FACTORY[keyParts[0]];

                if (type) {
                    keyParts[0] = null;
                    this.elements_.push(new (type.bind.apply(type, keyParts)));
                }
                else {
                    throw part + " starts with a [ ends with a ] but does not have a constructor";
                }
            }
            else {
                this.elements_.push(new recoil.db.Path.Item(part));
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
 * @param {number?} opt_start the depth of the path to start on
 */
recoil.db.Path.prototype.forEach = function (value, func, opt_start, opt_parents) {
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
        item.forEach(value, function (subValue) {
            me.forEach(subValue, func, opt_start + 1);
        });
                   
    }
    else {
        func(value, opt_parents);
    }
};

/**
 * calls func for each node that matches the path
 * @param {Object} value
 * @param {function(*, !IArrayLike<*>)} func first is the object second 
 * is the parents
 * @param {number?} opt_start the depth of the path to start on
 * @private
 */
recoil.db.Path.prototype.forEachParent_ = function (value, func, opt_start, opt_parents) {
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
        item.forEach(value, function (subValue) {
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
 */
recoil.db.Path.prototype.reset = function (object, check) {
    this.forEachParent_(object, function (part, value, parents) {
        if (check(parents)) {
            part.reset(value);
        }
    });
};


/**
 * puts an item at the the path
 * @param {!Object} object
 * @param {*} val
 */
recoil.db.Path.prototype.put = function (object, key, val, check) {
    this.forEachParent_(object, function (part, value, parents) {
        if (check(parents)) {
            part.put(value,key, val);
        }
    });

};

/**
 * puts an item at the the path
 * @param {!Object} object
 */
recoil.db.Path.prototype.get = function (object, key, check) {
    var val = undefined;
    this.forEachParent_(object, function (part, value, parents) {
        if (check(parents)) {
            val = part.get(value,key);
        }
    });
    return val;
};


/**
 * this indicated that we should get every item in an array
 *
 * @constructor
 * @implements recoil.db.PathItem
 */
recoil.db.Path.Array = function (var_fields) {
    if (arguments.length === 0) {
        
        this.lookup_ = {
            get : function (arr, idx) {
                return arr[idx];
            }
        };
    }
    else {
        var args = arguments;
        this.lookup_ = {
            get : function (arr, obj) {
                for (var i = 0; i < arr.length; i++) {
                    var cur = arr[i];
                    for (var j = 0; j < args.length; j++) {
                        var k = args[j];
                        if (recoil.util.object.isEqual(cur[k], obj[j])) {
                            return cur;
                        }
                    }
                }
                
            return undefined;
            }
        };
    }
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Array.prototype.forEach = function (value, callback) {
    for (var i = 0; i < value.length; i++) {
        callback(value[i]);
    }
};

recoil.db.Path.Array.prototype.reset = function (value) {
    value.length = 0;
};

recoil.db.Path.Array.prototype.put = function (parent, key, val) {
    parent.push(val);
};

recoil.db.Path.Array.prototype.get = function (parent, key) {
    return this.lookup_.get(parent, key);
};


/**
 * every item in the avl tree
 * @implements recoil.db.PathItem
 * @constructor
 */
recoil.db.Path.Avl = function () {
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Avl.prototype.forEach = function (value, callback) {
    value.inOrderTraverse(callback);
};
 
recoil.db.Path.Avl.prototype.reset = function (value) {
    value.clear();
};

    recoil.db.Path.Avl.prototype.put = function (parent, key, val) {
        parent.add(val);
};

recoil.db.Path.Avl.prototype.get = function (parent, key)  {
    throw "not inmplemented yet";
};



/**
 * basic item get it by name
 * @constructor
 * @param {!String} name the name of the item
 */
recoil.db.Path.Item = function (name) {
    this.name_ = name;
};

/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Item.prototype.forEach = function (value, callback) {
    callback(value[this.name_]);
};


recoil.db.Path.Item.prototype.reset = function (value) {
};

recoil.db.Path.Item.prototype.put = function (parent, key, val) {
    parent[this.name_] = val;
};


/**
 * every item in the the object
 * @constructor
 * @implements recoil.db.PathItem
 */
recoil.db.Path.Object = function () {
};


/**
 * @param {*} value
 * @param {function(*)} callback
 */

recoil.db.Path.Object.prototype.forEach = function (value, callback) {
    for (var key in value) {
        callback(value[key]);
    }
};

recoil.db.Path.Object.prototype.put = function (parent, key, val) {
    parent[key] = val;
};

recoil.db.PathItem.addDefaultType("#", recoil.db.Path.Array);
recoil.db.PathItem.addDefaultType("map", recoil.db.Path.Avl);
recoil.db.PathItem.addDefaultType("obj", recoil.db.Path.Object);

