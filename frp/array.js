goog.provide('recoil.frp.Array');

goog.require('recoil.frp.Util');



/**
 * @constructor
 * 
 */
recoil.frp.Array = function (frp) {
    this.frp_ = frp;
    this.util_ = new recoil.frp.Util(frp); 
};

/**
 * @param {Array<*>|recoil.frp.Behaviour<Array<*>>} array
 * @return {recoil.frp.Behaviour<Boolean>}
 */
recoil.frp.Array.prototype.isEmpty = function (array) {
    this.frp_.liftB(function(arr) {
        return arr.length === 0;
    }, this.util_.toBehaviour(array));
};


/**
 * @param {Array<*>|recoil.frp.Behaviour<Array<*>>} array
 * @return {recoil.frp.Behaviour<Boolean>}
 */
recoil.frp.Array.prototype.isNotEmpty = function (array) {
    this.frp_.liftB(function(arr) {
        return arr.length > 0;
    }, this.util_.toBehaviour(array));
};


/**
 * @template T
 * @param {Array<T>|recoil.frp.Behaviour<Array<T>>} array
 * @param {(!function(T) : boolean|!recoil.frp.Behaviour<!function(T) : boolean>)} filter
 * @return {recoil.frp.Behaviour<Array<T>>}
 */
recoil.frp.Array.prototype.filter = function (array, filter) {
    this.frp_.liftB(function(arr, filter) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            if (filter(arr[i])) {
                res.push(arr[i]);
            }
        }
        return res;
    }, this.util_.toBehaviour(array), this.util_.toBehaviour(filter));
};


/**
 * @template FROM
 * @template TO
 * @param {Array<FROM>|recoil.frp.Behaviour<Array<FROM>>} array
 * @param {(!function(FROM) : TO|!recoil.frp.Behaviour<!function(FROM) : TO>)} map
 * @return {recoil.frp.Behaviour<!Array<TO>>}
 */
recoil.frp.Array.prototype.map = function (array, map) {
    this.frp_.liftB(function(arr, map) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            res.push(map(arr[i]));
        }
        return res;
    }, this.util_.toBehaviour(array), this.util_.toBehaviour(map));
};
