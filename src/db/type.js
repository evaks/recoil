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
 * @return {!Array<?>} the primary keys of the object
 */
recoil.db.Type.prototype.getKeys = function (obj) {};


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
 * @return {!Array<!recoil.db.Path>}
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
recoil.db.BasicType = function (keys, data, opt_subpaths) {
    this.keys_ = keys;
    this.data_ = data;
    this.subpaths_ = opt_subpaths || [];
    this.id_ = recoil.db.Type.seq.next();
};



/**
 * gets a list of all the objects that this object can be made up out of
 * @return {!Array<!recoil.db.Path>}
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
 * used for subpaths inorder so that we can determine which key should be used for
 * a subpath
 * @param {!recoil.db.Type} type
 * @param {!recoil.db.Path|!string} path the path to type
 * @constructor
 */
recoil.db.TypePath = function (type, path) {
    this.path_ = typeof(path) === "string" ? new recoil.db.Path(path) : path;
    this.type_ = type;
};