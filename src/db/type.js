goog.provide('recoil.db.Type');
goog.provide('recoil.db.BasicType');
goog.provide('recoil.db.TypePath');

goog.require('recoil.db.Path');
goog.require('recoil.util.Sequence');

/**
 * @interface
 * @template T
 */
recoil.db.Type = function() {};

/**
 * @param {Object} obj the object
 * @param {!Array<!Object>} parents the parents of object
 * @return {!Array<?>} the primary keys of the object
 */
recoil.db.Type.prototype.getKeys = function (obj, parents) {};


/**
 * @return {string} an unique id identifing this key, use .seq in order
 * to generate one
 */
recoil.db.Type.prototype.uniqueId = function () {};

/**
 * @final
 * @type recoil.util.Sequence
 */
recoil.db.Type.seq = new recoil.util.Sequence();



/**
 * gets a list of all the objects that this object can be made up out of
 * @return {!Array<!recoil.db.TypePath>}
 */
recoil.db.Type.prototype.getPaths = function () {
};

/**
 * a type that has a value and possibly some references to so external values
 * @param {!Array<string>} keys
 * @param {*} data arbitary data that can be used the the database to figure out what key it is
 * @param {Array<!recoil.db.TypePath>?} opt_subpaths
 * @implements recoil.db.Type
 * @constructor
 */
recoil.db.BasicType = function (keys, data, opt_keyGetter, opt_subpaths) {
    this.keys_ = keys;
    this.data_ = data;
    this.keyGetter_ = opt_keyGetter ? opt_keyGetter : recoil.db.SimpleKeyGetter(keys);
    this.subpaths_ = opt_subpaths || [];
    this.id_ = recoil.db.Type.seq.next();
};



/**
 * gets a list of all the objects that this object can be made up out of
 * @return {!Array<!recoil.db.TypePath>}
 */
recoil.db.BasicType.prototype.getPaths = function () {
    return this.subpaths_;
};

/**
 * @return {*}
 */
recoil.db.BasicType.prototype.getData = function () {
    return this.data_;
};

/**
 * @return {string} an unique id identifing this key
 */
recoil.db.BasicType.prototype.uniqueId = function () {
    return this.id_;
};


/**
 * @param {Object} obj the object
 * @param {!Array<!Object>} parents the parents of object
 * @return {!Array<?>} the primary keys of the object
 */
recoil.db.BasicType.prototype.getKeys = function (obj, parents) {
    return this.keyGetter_(obj, parents);
};


/**
 * used for subpaths inorder so that we can determine which key should be used for
 * a subpath
 * @param {!recoil.db.Type} type
 * @param {!recoil.db.Path|!string|!Array<!string>} path the path to type if
 *                  the type is string it is split o /
 * @constructor
 */
recoil.db.TypePath = function (type, path) {
    if (typeof (path) === 'string') {
        this.path_ = new recoil.db.Path(path.split('/'));
    }
    else if (goog.isArrayLike(path)) {
        this.path_ = new recoil.db.Path(path);
    }
    else {
        this.path_ = path;
    }
    this.type_ = type;
};

recoil.db.TypePath.prototype.getType = function () {
    return this.type_;
}
/**
 * calls itr for each item that matches the type path,
 * 
 * @param {!Object} obj the object to iterate over
 * @param {!function(*,*)} itr called for each item, the first paramter is the 
 *                             key the object, the second is the object 
 */

recoil.db.TypePath.prototype.forEach = function (obj, itr) {
    var me = this;
    this.path_.forEach(obj, function (sub, parents) {
        itr(me.type_.getKeys(sub, parents), sub);
    });
};



/**
 * @param {Object} obj the object
 * @param {!Array<!Object>} parents the parents of object
 * @return {!Array<?>} the primary keys of the object
 */
recoil.db.TypePath.prototype.getKeys = function (obj, parents) {
    return this.type.getKeys(obj, parents);
};

/**
 * clears the object at the path ready for new objects be put in
 * @param {!Object} object
 */
recoil.db.TypePath.prototype.reset = function (object) {
    this.path_.reset(object);
};

/**
 * puts an item at the the path
 * @param {!Object} object
 * @param {*} val
 */
recoil.db.TypePath.prototype.put = function (object, val) {
    this.path_.put(object, val);
};
/***
 *
 * @param {!Array<!string>} var_keys each element specifies the keys
 *                                   this list is backwards, starting at the
 *                                   and working up through the ancestors
 */
recoil.db.SimpleKeyGetter = function (var_keys) {
    var args = arguments;
    return function (object, parents) {
        var res = [];
        var arg = 0;
        if (args.length > 0) {
            for (var i = 0; i < args[arg].length; i++) {
                var key = args[arg][i];
                res.push(object[key]);
            }
        }
        var parent = 0;
        for (arg = args.length - 1;
             arg > 0 && parent < parents.length; arg--) {
            for (i = 0; i < args[arg].length; i++) {
                key = args[arg][i];
                res.push(parents[parent][key]);
            }
            parent++;
        }
        return res;
    };
};
