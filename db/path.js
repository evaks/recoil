goog.provide('recoil.db.Path');
goog.provide('recoil.db.PathItem');

goog.require('goog.struct.AvlTree');

/**
 * @interface
 */
recoil.db.PathItem = function () {
};

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

recoil.db.Path.prototype.forEach = function (value, func, opt_start) {
    opt_start = opt_start || 0;
    var me = this;
    if (opt_start < this.elements_.length) {
        var item = this.elements_[i];
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
 * basic item get it by name
 * @constructor
 * @param {!String} name the name of the item
 */
recoil.db.Path.Item = function (name) {
    this.name_ = name;
};


/**
 * every item in the avl tree
 * @constructor
 */
recoil.db.Path.Avl = function () {
};

/**
 * every item in the the object
 * @constructor
 */
recoil.db.Path.Object = function () {
};

recoil.db.PathItem.addDefaultType("", recoil.db.Path.Array);
recoil.db.PathItem.addDefaultType("map", recoil.db.Path.Avl);
recoil.db.PathItem.addDefaultType("obj", recoil.db.Path.Object);

