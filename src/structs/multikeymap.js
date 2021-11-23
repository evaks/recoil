/**
 * provides a map where you can find or remove items via multiple keys
 * each key does not have to be unique
 */

goog.provide('recoil.structs.MultiKeyMap');

goog.require('goog.structs.AvlTree');
goog.require('recoil.util.object');
/**
 * @constructor
 * @param {!Array<string|{col:string, compare:function(?,?):number}>} keys
 */
recoil.structs.MultiKeyMap = function(keys) {
    this.keys_ = {};
    var comps = keys.map(function(v) {
        if (typeof (v) === 'string') {
            return recoil.util.object.compare;
        }
        else {
            return v.compare;
        }
    });

    var keyNames = keys.map(function(v) {
        if (typeof (v) === 'string') {
            return v;
        }
        else {
            return v.col;
        }
    });
    var allCompare = function(x, y) {
        for (var i = 0; i < keys.length; i++) {
            var res = comps[i](x[keyNames[i]], y[keyNames[i]]);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    };

    this.all_ = new goog.structs.AvlTree(allCompare);
    this.sync_ = {};
    this.id_ = 0;
    var me = this;
    var makeCompare = function(compare) {
        return function(x, y) {
            var res = compare(x.key, y.key);
            return res;
        };
    };
    keys.forEach(function(v) {
        if (typeof (v) === 'string') {
            me.keys_[v] = new goog.structs.AvlTree(makeCompare(recoil.util.object.compare));
        }
        else {
            me.keys_[v.col] = new goog.structs.AvlTree(makeCompare(v.compare));
        }
    });

};

/**
 * @param {string} key
 * @return {number}
 *
 */
recoil.structs.MultiKeyMap.prototype.keySize = function(key) {
    var res = 0;
    this.keys_[key].inOrderTraverse(function(e) {
        res++;
    });
    return res;

};

/**
 * @return {number}
 *
 */
recoil.structs.MultiKeyMap.prototype.size = function() {
    var res = 0;
    for (var k in this.sync_) {
        res++;
    }
    return res;

};
/**
 * add the item to all maps if the key doesn't exist it does not get added
 * to that map
 * @param {Object} object
 *
 */
recoil.structs.MultiKeyMap.prototype.add = function(object) {
    if (this.all_.findFirst(object)) {
        return;
    }
    let id = this.id_++;
    this.sync_[id] = object;
    this.all_.add(object);

    for (var k in this.keys_) {
        var map = this.keys_[k];
        if (object[k] !== undefined) {
            map.safeFind({key: object[k], ids: {}}).ids[id] = true;
        }
    }
};

/**
 * @private
 * @param {!Array<string>} keys
 * @param {Object} object
 * @return {Object<string,boolean>}
 */
recoil.structs.MultiKeyMap.prototype.getIds_ = function(keys, object) {
    var map = this.keys_[keys[0]];
    var item = map.findFirst({key: object[keys[0]], ids: {}});
    var me = this;
    if (item !== null) {
        var ids = goog.object.clone(item.ids);

        for (var i = 1; i < keys.length; i++) {
            var key = keys[i];
            var otherItem = this.keys_[key].findFirst({key: object[key], ids: {}});
            if (!otherItem) {
                ids = {};
                break;
            }
            for (var k in ids) {
                if (!otherItem.ids[k]) {
                    delete ids[k];
                }
            }
        }
        for (var k in ids) {
            ids[k] = this.sync_[k];
        }
        return ids;
    }
    return [];
};

/**
 * get all objects that have match all keys
 * @param {!Array<string>} keys
 * @param {Object} object
 * @return {!Array<Object>}
 */
recoil.structs.MultiKeyMap.prototype.get = function(keys, object) {
    var ids = this.getIds_(keys, object);

    var res = [];
    for (var k in ids) {
        res.push(this.sync_[k]);
    }
    return res;
};
/**
 * @param {!Array<string>} keys
 * @param {Object} object
 * @return {!Array} the items removed
 */

recoil.structs.MultiKeyMap.prototype.removeIntersection = function(keys, object) {
    var ids = this.getIds_(keys, object);
    // todo object is wrong we need specific on for each id
    for (var key in this.keys_) {
        var map = this.keys_[key];
        for (var id in ids) {
            var curObject = ids[id];
            var item = map.findFirst({key: curObject[key], ids: {}});
            if (item) {
                delete item.ids[id];
                if (recoil.util.map.isEmpty(item.ids)) {
                    map.remove({key: curObject[key]});
                }
            }

        }
    }
    let res = [];
    var me = this;
    for (let id in ids) {
        this.all_.remove(me.sync_[id]);
        res.push(me.sync_[id]);
        delete me.sync_[id];
    }
    return res;
};

/**
 * prints for debugging
 */
recoil.structs.MultiKeyMap.prototype.print = function() {
    console.log('sync');
    for (var k in this.sync_) {
        console.log('  ' + k + ':', JSON.stringify(this.sync_[k]));
    }
    for (var key in this.keys_) {
        console.log(key + ':');
        var map = this.keys_[key];
        map.inOrderTraverse(function(el) {
            console.log(JSON.stringify(el));
        });
    }
};


/**
 * @param {string} key
 * @param {Object} toRemove
 */
recoil.structs.MultiKeyMap.prototype.remove = function(key, toRemove) {
    var removeMap = this.keys_[key];

    var item = removeMap.remove({key: toRemove[key], ids: []});
    if (item !== null) {
        for (var i = 0; i < item.ids.length; i++) {
            var id = item.ids[i];
            var object = this.sync_[id];

            this.sync_[id] = object;

            for (var k in this.keys_) {
                var map = this.keys_[k];
                var found = map.findFirst({key: object[k], ids: {}});
                if (found) {
                    delete found.ids[id];
                    if (recoil.util.map.isEmpty(found.ids)) {
                        map.remove({key: object[k], ids: {}});
                    }
                }
            }
        }
    }
};
