/**
 * provides a set of utilities that give logical operation
 *
 */
goog.provide('recoil.frp.logic');
goog.provide('recoil.frp.logic.sc');

goog.require('recoil.frp.Chooser');
goog.require('recoil.frp.util');
goog.require('recoil.util.func');
goog.require('recoil.util.object');



/**
 * a utility module that provides
 * set of logic funtions
 * all expressions are evaluated so no short circuiting, the advantage of this,
 * means that just because logic value changes we will not need to go possibly long
 * operations to calculate the alternative.
 *
 * it is possible to add a set of short circuted logic functions as well, this could easily be done
 * using recoil.frp.Chooser
 *
 */

/**
 * utilty to get the frp engin out of the arguments
 * @private
 * @param {!IArrayLike} args
 * @return {!recoil.frp.Frp}
 */
recoil.frp.logic.getFrp_ = function(args) {
    for (var i = 0; i < args.length; i++) {
        if (args[i] instanceof recoil.frp.Behaviour) {
            return args[i].frp();
        }
    }
    throw 'No Behaviours given';
};
/**
 * @param {(!recoil.frp.Behaviour<!boolean>|!boolean)} first
 * @param {...(!recoil.frp.Behaviour<!boolean>|!boolean)} var_args note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.and = function(first, var_args) {
    var frp = recoil.frp.logic.getFrp_(arguments);

    return recoil.util.func.invokeOneParamAndArray(frp, frp.liftB, function() {
        for (var i = 0; i < arguments.length; i++) {
            if (!arguments[i]) {
                return false;
            }
        }
        return true;
    }, recoil.frp.util.toBehaviours(frp, arguments));
};

/**
 * short circuit version of and i.e. does not evaluate all the arguments
 * @param {(!recoil.frp.Behaviour<!boolean>|!boolean)} first
 * @param {...(!recoil.frp.Behaviour<!boolean>|!boolean)} var_args note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.sc.and = function(first, var_args) {
    var frp = recoil.frp.logic.getFrp_(arguments);
    var util = new recoil.frp.Util(frp);
    var res = util.toBehaviour(arguments[arguments.length - 1]);

    for (var i = arguments.length - 2; i >= 0; i--) {
        var next = util.toBehaviour(arguments[i]);
        res = recoil.frp.Chooser.if(next, res, false);
    }
    return res;
};

/**
 * @param {(!recoil.frp.Behaviour<!boolean>|!boolean)} first
 * @param {...(!recoil.frp.Behaviour<!boolean>|!boolean)} var_args note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.or = function(first, var_args) {
    var frp = recoil.frp.logic.getFrp_(arguments);

    return recoil.util.func.invokeOneParamAndArray(frp, frp.liftB, function() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]) {
                return true;
            }
        }
        return false;
    }, recoil.frp.util.toBehaviours(frp, arguments));
};

/**
 * short circuit version of and i.e. does not evaluate all the arguments
 * @param {(!recoil.frp.Behaviour<!boolean>|!boolean)} first
 * @param {...(!recoil.frp.Behaviour<!boolean>|!boolean)} var_args note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.sc.or = function(first, var_args) {
    var frp = recoil.frp.logic.getFrp_(arguments);
    var util = new recoil.frp.Util(frp);
    var res = util.toBehaviour(arguments[arguments.length - 1]);

    for (var i = arguments.length - 2; i >= 0; i--) {
        var next = util.toBehaviour(arguments[i]);
        res = recoil.frp.Chooser.if(next, true, res);
    }
    return res;
};

/**
 * @param {!recoil.frp.Behaviour<!boolean>} x
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.not = function(x) {
    return x.frp().liftB(function(x) {return !x;},x);
};

/**
 * @template T
 * @param {(!recoil.frp.Behaviour<T>|T)} x
 * @param {(!recoil.frp.Behaviour<T>|T)} y note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.equal = function(x, y) {
    var frp = recoil.frp.logic.getFrp_(arguments);
    var util = new recoil.frp.Util(frp);
    return frp.liftB(function(x, y) {return recoil.util.object.isEqual(x, y);}, util.toBehaviour(x), util.toBehaviour(y));
};

/**
 * @template T
 * @param {(!recoil.frp.Behaviour<T>|T)} x
 * @param {(!recoil.frp.Behaviour<T>|T)} y note at least one parameter must be a behavior
 * @return {!recoil.frp.Behaviour<!boolean>}
 */
recoil.frp.logic.notEqual = function(x, y) {
    var frp = recoil.frp.logic.getFrp_(arguments);
    var util = new recoil.frp.Util(frp);
    return frp.liftB(function(x, y) {return !recoil.util.object.isEqual(x, y);}, util.toBehaviour(x), util.toBehaviour(y));
};

