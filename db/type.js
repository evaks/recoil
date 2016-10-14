goog.provide('recoil.db.Type');
goog.provide('recoil.db.BasicType');

goog.require('recoil.db.Path');


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
 * gets a list of all the objects that this object can be made up out of
 * @return {!Array<!recoil.db.OwnedPath>}
 */
recoil.db.Type.prototype.getPaths = function () {
};

/**
 * a type that has a value and possibly some references to so external values
 * @param {!Array<string>} keys
 * @param {*} data arbitary data that can be used the the database to figure out what key it is
 * @param {Array<!recoil.db.OwnedPath>?} opt_subpaths
 * @implements recoil.db.Type
 * @constructor
 */
recoil.db.BasicType = function (keys, data, opt_subpaths) {
    this.keys_ = keys;
    this.data_ = data;
    this.subpaths_ = opt_subpaths || [];
};



/**
 * gets a list of all the objects that this object can be made up out of
 * @return {!Array<!recoil.db.OwnedPath>}
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
