goog.provide('recoil.util.map');


/**
 * gets an item out of a map, if the item
 * does not exist it will insert the default into the map
 * and return that
 * @template T
 * @param {Object} map
 * @param {?} key
 * @param {T} def
 * @return {T}
 */

recoil.util.map.safeGet = function(map, key, def) {
    var res = map[key];
    if (!res) {
        res = def;
        map[key] = def;
    }
    return res;
};
