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
 * @param {func(*)} callback
 */

recoil.db.PathItem.prototype.forEach = function (value, func) {};

/**
 * @type Map<String,*>  
 */
recoil.db.PathItem.FACTORY = {};
/**
 * adds an item so that you can use strings to construct a path
 * @param {!String} prefix the name to be used inside []
 * @param {*) type the class of the item to use, it can take any arguments thes will be the
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
 * []      every item in an array 
 * [obj]   every item in an object
 * [map]   every item in an avl tree
 * 
 *  you may specify more tems by calling recoil.db.PathItem.addDefaultType
 *
 * @param {Array<!recoil.db.PathItem|!recoil.db.String>} var_parts
 * @constructor
 */
recoil.db.Path = function (var_parts) {
    this.elements_ = [];

    for (var i = 0; i < arguments.length; i++) {
        var part = arguments[i];
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
 * @param {func(*)} func
 * @param {number?} opt_start the depth of the path to start on
 */
recoil.db.Path.prototype.forEach = function (value, func, opt_start) {
    opt_start = opt_start || 0;
    var me = this;
    if (opt_start < this.elements_.length) {
        var item = this.elements_[opt_start];
        if (!value) {
            return;
        }
        item.forEach(value, function (subValue) {
            me.forEach(subValue, func, opt_start + 1);
        });
                   
    }
    else {
        func(value);
    }
};

/**
 * this indicated that we should get every item in an array
 *
 * @constructor
 * @implements recoil.db.PathItem
 */
recoil.db.Path.Array = function () {
    
};

/**
 * @param {*} value
 * @param {func(*)} callback
 */

recoil.db.Path.Array.prototype.forEach = function (value, func) {
    for (var i = 0; i < value.length; i++) {
        func(value[i]);
    }
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
 * @param {func(*)} callback
 */

recoil.db.Path.Avl.prototype.forEach = function (value, func) {
    value.inOrderTraverse(func);
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
 * @param {func(*)} callback
 */

recoil.db.Path.Item.prototype.forEach = function (value, func) {
    func(value[this.name_]);
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
 * @param {func(*)} callback
 */

recoil.db.Path.Object.prototype.forEach = function (value, func) {
    for (var key in value) {
        func(value[key]);
    }
};

recoil.db.PathItem.addDefaultType("", recoil.db.Path.Array);
recoil.db.PathItem.addDefaultType("map", recoil.db.Path.Avl);
recoil.db.PathItem.addDefaultType("obj", recoil.db.Path.Object);

