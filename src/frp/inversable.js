goog.provide('recoil.frp.Inversable');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.Util');

/**
 * @interface
 * @template T,Input,Output
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
 * @return {Output} objects to set
 */

recoil.frp.Inversable.prototype.inverse = function(val, sources) {
};

/**
 * create a behaviour from an inversable
 * @template Output, Input
 * @param {!recoil.frp.Frp} frp
 * @param {!recoil.frp.Inversable} inversable
 * @param {Input} params
 * @return {Output}
 */
recoil.frp.Inversable.create = function(frp, inversable, params) {
    var paramStruct = {};
    var util = new recoil.frp.Util(frp);
    for (var k in params) {
        if (params.hasOwnProperty(k)) {
            paramStruct[k] = util.toBehaviour(params[k]);
        }
    }

    var resolveStruct = function() {
        var res = {};
        for (var k in paramStruct) {
            if (paramStruct.hasOwnProperty(k)) {
                res[k] = paramStruct[k].get();
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

    for (k in params) {
        if (paramStruct.hasOwnProperty(k)) {
            funcParams.push(paramStruct[k]);
        }
    }
    return frp.liftBI.apply(frp, funcParams);
};
