goog.provide('recoil.util.map');


/**
 * gets an item out of a map, if the item
 * does not exist it will insert the default into the map
 * and return that
 * @template KT, T
 * @param {IObject<KT,T>} map
 * @param {KT} key
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
