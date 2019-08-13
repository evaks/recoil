goog.provide('recoil.util.map');


/**
 * gets an item out of a map, if the item
 * does not exist it will insert the default into the map
 * and return that
 * @template KT, T
 * @param {IObject<KT,T>|Object} map
 * @param {KT} key
 * @param {T=} opt_def
 * @return {T}
 */

recoil.util.map.safeGet = function(map, key, opt_def) {
    var res = map[key];
    if (res === undefined && arguments.length === 3) {
        res = opt_def;
        map[key] = opt_def;
    }
    return res;
};


/**
 * like safe get but takes a list of keys, this assumes
 * map is a recursive structure of maps, it will continue
 * to do a safe get until the keys run out
 * @template T
 * @param {Object|IObject} map
 * @param {Array} keys
 * @param {T=} opt_def
 * @return {T}
 */

recoil.util.map.safeRecGet = function(map, keys, opt_def) {
    if (keys.length === 0) {
        throw new Error('must provide at least one key');
    }
    var curMap = map;
    for (var i = 0; i < keys.length - 1; i++) {
        if (arguments.length === 3) {
            curMap = recoil.util.map.safeGet(curMap, keys[i], {});
        }
        else if (curMap) {
            curMap = recoil.util.map.safeGet(curMap, keys[i]);
        }
        else {
            return undefined;
        }
    }
    if (arguments.length === 3) {
        return recoil.util.map.safeGet(curMap, keys[i], opt_def);
    }
    return recoil.util.map.safeGet(curMap || {}, keys[i]);
};


/**
 * like safe get but takes a list of keys, this assumes
 * map is a recursive structure of maps, it will continue
 * to do a safe get until the keys run out
 * @template T
 * @param {!Object|IObject} map
 * @param {Array} keys
 * @param {function(T):boolean} removeFunc
 * @return {T}
 */

recoil.util.map.safeRecRemove = function(map, keys, removeFunc) {
    if (keys.length === 0) {
        throw new Error('must provide at least one key');
    }

    var curMap = map;
    var path = [];
    var i;
    for (i = 0; i < keys.length && curMap; i++) {
        path.push(curMap);
        curMap = curMap[keys[i]];
    }

    if (curMap) {
        if (removeFunc(curMap)) {
            for (i = path.length - 1; i >= 0; i--) {
                var pItem = path[i];
                delete pItem[keys[i]];
                if (!recoil.util.map.isEmpty(pItem)) {
                    break;
                }
            }
            return curMap;
        }
    }
    return null;
};
/**
 * checks if the map is empty a bit better than getting all the keys
 * and then checking the length
 * @param {Object|IObject} map
 * @return {boolean}
 */
recoil.util.map.isEmpty = function(map) {
    for (var k in map) {
        return false;
    }
    return true;
};

