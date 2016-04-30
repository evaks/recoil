/**
 * a boolean with an explaination
 * this is useful for enabling and disabling items
 * on the screen and providing a tooltip showing way something is disabled
 */

goog.provide('recoil.ui.BoolWithExplaination');

goog.require('recoil.ui.Message');
/**
 * @param {!boolean} val
 * @param {recoil.ui.Message=} opt_true
 * @param {recoil.ui.Message=} opt_false
 * @constructor
 */
recoil.ui.BoolWithExplaination = function(val, opt_true, opt_false) {
    this.val_ = val;
    this.true_ = opt_true ? opt_true : null;
    this.false_ = opt_false ? opt_false : null;
};

recoil.ui.BoolWithExplaination.TRUE = new recoil.ui.BoolWithExplaination(true);
recoil.ui.BoolWithExplaination.FALSE = new recoil.ui.BoolWithExplaination(false);

/**
 *
 * @param var_values
 * @return {recoil.ui.BoolWithExplaination}
 */
recoil.ui.BoolWithExplaination.prototype.and = function(var_values) {

    var trueExplain = [];
    var falseExplain = [];


    this.addExplain_(trueExplain, this.val_, this.true_);
    this.addExplain_(falseExplain, !this.val_, this.false_);

    var res = this.val_;
    for (var i = 0; i < arguments.length; i++) {
        this.addExplain_(trueExplain, arguments[i].val_, this.true_);
        this.addExplain_(falseExplain, !arguments[i].val_, this.false_);

        res = res && arguments[i].val_;
    }

    if (res) {
        return new recoil.ui.BoolWithExplaination(true, recoil.ui.Message.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplaination(false, null, recoil.ui.Message.join(falseExplain));
    }
};

/**
 *
 * @param frp
 * @param var_behaviours
 * @return {null}
 */
recoil.ui.BoolWithExplaination.and = function(frp, var_behaviours) {
    var behaviours = new recoil.frp.Util(frp).arrayToBehaviours(1, arguments);

    if (behaviours.length > 0) {
        return recoil.util.invokeParamsAndArray(frp.liftB, frp, function(arg1) {
            return recoil.util.invokeParamsAndArray(arg1.and, arg1, goog.array.slice(arguments, 1));
        }, behaviours);
    }
    return null;
};
/**
 * does an or on all the values and explains why it is true of false
 *
 * @param {Array<!recoil.ui.BoolWithExplaination>} var_values
 * @return {recoil.ui.BoolWithExplaination}
 */

recoil.ui.BoolWithExplaination.prototype.or = function(var_values) {
    var trueExplain = [];
    var falseExplain = [];


    this.addExplain_(trueExplain, this.val_, this.true_);
    this.addExplain_(falseExplain, !this.val_, this.false_);

    var res = this.val_;
    for (var i = 0; i < arguments.length; i++) {
        this.addExplain_(trueExplain, arguments[i].val_, this.true_);
        this.addExplain_(falseExplain, !arguments[i].val_, this.false_);

        res = res || arguments[i].val_;
    }

    if (res) {
        return new recoil.ui.BoolWithExplaination(true, recoil.ui.Message.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplaination(false, null, recoil.ui.Message.join(falseExplain));
    }
};

/**
 *
 * @param var_values
 * @return recoil.ui.BoolWithExplaination
 */
recoil.ui.BoolWithExplaination.prototype.not = function(var_values) {
    return new recoil.ui.BoolWithExplaination(!this.val_, this.false_, this.true_);
};

/**
 *
 * @param {Array<!recoil.ui.Message>} all
 * @param {!boolean} shouldAdd
 * @param {recoil.ui.Message} explain
 */
recoil.ui.BoolWithExplaination.prototype.addExplain_ = function(all, shouldAdd, explain) {
    if (shouldAdd && explain) {
        all.push(explain);
    }
};
