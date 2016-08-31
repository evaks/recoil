goog.provide('recoil.db.Type');


goog.require('recoil.db.ObjectPath');


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
 * @return {!Array<!recoil.db.ObjectPath>}
 */
recoil.db.Type.prototype.subObjects = function () {
};

/**
 * @contructor
 */

recoil.db.ObjectPathPart = function (field, iterator, keys) {
    this.field_ = field;
    this.iterator_ = iterator;
    this.keys_ = keys;
};


recoil.db.ObjectPathPart.prototype.get = function (object) {
    
    if (object) {
        if (this.field_) {
            return object[this.field_];
        }
        else if (this.keys_ !== undefined) {
            return this.iterator_.get(object, this.keys_);
        }
        else {
            throw "keys not defined for iterator, use get all";
        }
    }
    return undefined;
};

recoil.db.ObjectPathPart.prototype.getAll = function (object) {
    if (!object) {
        return [];
    }
    
    if (this.iterator_ && this.keys_ === undefined) {
        var res = [];
        this.iterator.forEach(function (key, v) {
            res.push({key : key, value : v});
        });
    }
    return [{key : this, value : this.get(object)}];
};
recoil.db.ObjectPathPart.arrayIterator_ = function (object, func) {
    for (var i = 0; i < object.length; i++) {
        func(object[i]);
    }
};

recoil.db.ObjectPathPart.mapIterator = function (object, func) {

};
/**
 * the name is a string of the field with the following exceptions
 * '#' will iterate over every item in the array
 * '%field1 %field2 ... %fieldn' will iterate every item in an avil tree
 * '%?' will iterate over every field in an object treating it as a map
 * 
 */

recoil.db.ObjectPathPart.create = function (name) {
    if (name === '#') {
        return new recoil.db.ObjectPathPart(null, recoil.db.ObjectPathPart.arrayIterator_);
    }
    if (name === '%?') {
        return new recoil.db.ObjectPathPart(null, recoil.db.ObjectPathPart.jsmapIterator_);
    }
    return new recoil.db.ObjectPathPart(name, null);
};

/**
 * a path to an object inside another object
 * a list of path parts if a parth part is a string recoil.db.ObjectPathPart.create 
 * will be used to create the path part see that for the format of the string
 *
 * for execptions to this construct an ObjectPathPart yourself,
 * NOTE: an unresolve path (e.g #), may only exist at the last level 
 * @constructor
 * @param {!Array<!recoil.db.ObjectPathPart>|!string} path
 */
recoil.db.ObjectPath = function (parts) {
    this.parts_ = [];
    for (var i = 0; i < parts.length; i++) {
        if (typeof(parts) === "string") {
            this.parts_.push(recoil.db.ObjectPathPart.create(parts[i]));
        }
        else {
            this.parts_.push(parts[i]);
        }
    }
};

/**
 * gets all the parts this path can refer to
 */

recoil.db.ObjectPath.prototype.getAll = function (object) {
    var cur = object;
    for (var i = 0; cur && i < this.parts_.length; i++) {
        cur = this.parts_[i].get(cur);
    }

    return this.parts_[this.parts_.length -1].getAll(cur);
};
