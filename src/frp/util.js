goog.provide('recoil.frp.Util');

goog.require('recoil.frp.Behaviour');
goog.require('recoil.ui.messages');
goog.require('recoil.util');
goog.require('recoil.frp.Frp')
goog.require('recoil.frp.struct')
/**
 * @constructor
 * @param {recoil.frp.Frp} frp the frp engine to do operations on
 */
recoil.frp.Util = function(frp) {
    this.frp_ = frp;
};

/**
 * converts a value to a behaviour, if the value is already a behaviour
 * does nothing
 * @template T,O
 * @param {recoil.frp.Behaviour<T> | T} value
 * @param {T=} opt_default
 * @return {!recoil.frp.Behaviour<O>}
 *
 */
recoil.frp.Util.prototype.toBehaviour = function(value, opt_default) {

    if (value instanceof recoil.frp.Behaviour) {
        return value;
    }
    else {
        if (opt_default !== undefined && value === undefined) {
            return this.frp_.createConstB(opt_default);
        }
        return this.frp_.createConstB(value);
    }
};
/**
 * if value is undefined returns behaviour with def
 *
 * @template T
 * @param {recoil.frp.Behaviour<T>|T} value
 * @param {recoil.frp.Behaviour<T>|T} def
 * @return {recoil.frp.Behaviour<T>}
 */
recoil.frp.Util.prototype.getDefault = function(value, def) {
    value = this.toBehaviour(value);
    def = this.toBehaviour(def);

    return this.frp_.liftBI(function() {
        if (value.get() === undefined) {
            return def.get();
        }
        return value.get();
    }, function(v) {
        value.set(v);
    }, value, def);

};
/**
 * converts each item into a behaviour if it is not already one
 *
 * @param {!number} start only convert items >= this index
 * @param {Array<recoil.frp.Behaviour|*>|Arguments} items
 * @return {Array<recoil.frp.Behaviour>} items made into behaviours
 */
recoil.frp.Util.prototype.arrayToBehaviours = function(start, items) {
    var res = [];
    for (var i = start; i < items.length; i++) {
        res.push(this.toBehaviour(items[i]));
    }
    return res;
};

/**
 *
 * @param {!number} start only convert items >= this index
 * @param {Array<recoil.frp.Behaviour>} items
 * @return {Array} an array of values stored in the behaviours
 */
recoil.frp.Util.arrayToValues = function(start, items) {
    var res = [];
    for (var i = start; i < items.length; i++) {
        res.push(items[i].get());
    }
    return res;
};

/**
 *
 * @param {...recoil.frp.Behaviour} var_values
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.Util.prototype.isAllGood = function(var_values) {

    var outerArg = arguments;
    return recoil.util.invokeParamsAndArray(this.frp_.metaLiftB, this.frp_, function() {
        for (var i = 0; i < outerArg.length; i++) {
            if (!outerArg[i].metaGet().good()) {
                return new recoil.frp.BStatus(false);
            }
        }
        return new recoil.frp.BStatus(true);
    }, arguments);
};

/**
 *
 * @param {...recoil.frp.Behaviour} var_values
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.frp.Util.prototype.isAllGoodExplain = function(var_values) {

    var outerArg = arguments;
    return recoil.util.invokeParamsAndArray(this.frp_.metaLiftB, this.frp_, function() {
        var result = new recoil.frp.BStatus(false);
        var errors = [];
        var ready = true;

        for (var i = 0; i < outerArg.length; i++) {
            var meta = outerArg[i].metaGet();
            if (!meta.good()) {
                goog.array.extend(errors, meta.errors());
                if (ready && meta.notReady()) {
                    errors.push(recoil.ui.messages.NOT_READY);
                    ready = false;
                }
            }
        }
        if (errors.length == 0) {
            return new recoil.frp.BStatus(recoil.ui.BoolWithExplanation.TRUE);
        }

        return new recoil.ui.BoolWithExplanation(false, recoil.ui.messages.join(errors));

    }, arguments);
};

/*
var x = createB(1);
var y = createB(2);

var z = metaLiftB(function() {return x.get() + y.get()}, x, y);
*/

/**
 * This is a utility that creates an object that will do some checking on structs
 * passed to widgets in the widgets create a constant like so:
 *
 * var options = recoil.frp.Util.Options('a', {b : 'def1', c: 'def'}, 'x(a,b)');
 *
 * when using it to create the structure do the following
 * var struct = options.a(1).x(2,4).b('fish');
 *
 * the values passed can be normal values or behaviours.
 *
 * then either do
 *
 * struct.attach(widget) or struct.attachStruct(struct.struct()) to attach the data
 *
 * in the widget to access the values do the following
 *
 * var bound = options.bind(struct);
 *
 * the to access the behaviours, that will have defaults populated do:
 *
 * var valB = bound.a(); to access a
 *
 * the following describes the format the var_options parameter, their can be any number of them
 * and as long as the names don't clash it should work
 *
 * all identifiers should be valid javascript identifies for ease of use
 *
 * there are 3 types of values that var_options can have:
 *
 * 1. simple string e.g. 'value', this means the user must specify the item as no default is provided
 * 2. function e.g. 'render(button, menu)' this requires the user of the widget to provide all the parameters
 *             this is useful when groups of parameters must be specified together.
 *             The values can be accessed inside the widget in this example by bound.render_button and bound.render_menu
 * 3. An object, this provides a mechanism for specifying defaults, the keys can be like 1 and 2 and the default values are
 *               the values, you can either specify multiple keys in 1 object or multiple object parameters.
 *               To specify defaults of functions (type 2) the default should be an object with fields matching the parameters
 *
 * @param {!string|!Object} var_options
 * @returns {!Object} this has dynamic fields based on the parameters, and struct, attach, and bind function
 *
 */

recoil.frp.Util.Options = function(var_options) {
    var res = {};
    var remaining = {};

    var checkRemaining = function (remaining) {
        for (var i in remaining) {
            if (!(remaining[i] instanceof Object)) {
                throw "missing argument";
            }
        }
    };
    var mkSetFunc =  function (struct, remaining, name, params) {
        struct = goog.object.clone(struct);
        remaining = goog.object.clone(remaining);

       return function (var_vals) {

            delete remaining[name];

            if(name instanceof Object){
                for(var n in name) {
                    struct[n] = var_vals;
                }
            } else {
                if (arguments.length !== params.length) {
                    throw "Invalid number of arguments";
                }
                for (var i = 0; i < arguments.length; i++) {
                    struct[params[i]] = arguments[i];
                }

            }


            var res1 = {};
            for (var name1 in remaining) {
                functionParams(remaining[name1]).forEach(function (func) {
                    res1[func.name] = mkSetFunc(struct, remaining, func.name, func.params);
                });
            }
            res1.struct = function () {
                checkRemaining(remaining);
                return struct;
            };
            res1.attach = function (widget) {
                checkRemaining(remaining);
                widget.attachStruct(struct);
            };
            return res1;
        }
    };

    function functionParams(name, defVal) {
        if (name instanceof Object) {
            var objRes = [];
            for (var n in name) {
                functionParams(n, name[n]).forEach(function (p) {
                    objRes.push(p);
                })
            }
            return objRes;
        }

        var defMap = {};
        name = name.trim();

        var startIndex = name.indexOf('(');
        if (startIndex !== -1 || name.endsWith(')')) {

            var prefix = name.substring(0, startIndex).trim();
            var params = name.substring(startIndex + 1, name.length - 1);
            var paramArr = params.split(',');
            var res = [];
            paramArr.forEach(function (p) {
                p = p.trim();
                res.push(prefix + "_" + p);
                if (defVal) {
                    if (!defVal.hasOwnProperty(p)) {
                        throw "you must specify " + p;
                    }
                    defMap[prefix + "_" + p] = defVal[p];
                }
            });

            return [{name : prefix , params : res, def : defMap}];
        }
        else {
            if (defVal) {
                defMap[name] = defVal;
            }
            return [{name : name, params : [name], def : defMap}];
        }
    }

    var args = arguments;

    for (var i = 0; i < arguments.length; i++) {
        var name = arguments[i];
        functionParams(name).forEach (function (func) {
            remaining[func.name] = name;
        });
    }


    for (var i = 0; i < arguments.length; i++) {
        var name = arguments[i];
        functionParams(name).forEach (function (func) {
            res[func.name] = mkSetFunc({}, remaining, func.name, func.params);
        });
    }


    res.struct = function () {
        checkRemaining(remaining);
        return {};
    };
    res.attach = function (widget) {
        checkRemaining(remaining);
        widget.attachStruct({});
    };

    /**
     *
     * @param {recoil.frp.Frp} frp
     * @param {!recoil.frp.Behaviour<!Object>|!Object} val
     * @returns {!Object}
     */
    res.bind = function (frp, val) {
        var optionsB = recoil.frp.struct.flatten(frp, val);
        var res = {};
        for (var i = 0; i < args.length; i++)
            (function (name) {
                var funcs = functionParams(name);
                funcs.forEach(function (func) {
                    func.params.forEach(function (param) {
                        res[param] = function () {
                            return recoil.frp.struct.get(param, optionsB, func.def[param]);
                        }
                    });
                });

        })(args[i]);
        return res;

    };
    return res;
};
