goog.provide('recoil.frp.Inversable');



/**
 * @interface
 * @template T,Input
 * Input is the input type it is a struct that defines the inputs
 * T is the result type
 */

recoil.frp.Inversable = function() {};

/**
 * @param {Input} params
 * @return {T}
 */

recoil.frp.Inversable.prototype.calculate = function(params) {
};


/**
 * @param {T} val
 * @param {Input} sources
 * @return {Input} objects to set
 */

recoil.frp.Inversable.prototype.inverse = function(val, sources) {
};

/**
 * create a behaviour from an inversable
 * @template T, Input
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Inversable} inversable
 * @param {Input} params
 * @return {Input}
 */
recoil.frp.Inversable.create = function(frp, inversable, params) {
    var paramStruct = {};
    var resolveStruct = function() {
        var res = {};
        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                res[k] = util.toBehaviour(params[k]);
            }
        }
        return res;
    };

    var funcParams = [
        function() {
            return inversable.calculate(resolveStruct());
        },
        function(val) {
            var res = inversable.inverse(val, resolveStruct());
            for (var k in res) {
                paramStruct[k].set(val);
            }
        }
    ];
    var util = new recoil.frp.Util(frp);

    for (var k in params) {
        if (params.hasOwnProperty(k)) {
            paramStruct[k] = util.toBehaviour(params);
        }
    }

    return frp.liftBI.apply(frp, funcParams);
};
