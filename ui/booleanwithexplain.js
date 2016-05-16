/**
 * a boolean with an explaination
 * this is useful for enabling and disabling items
 * on the screen and providing a tooltip showing way something is disabled
 */

goog.provide('recoil.ui.BoolWithExplaination');

goog.require('recoil.frp.Util');
goog.require('recoil.ui.message.Message');
goog.require('recoil.ui.messages');

/**
 *
 * @param {!boolean} val
 * @param {recoil.ui.message.Message=} opt_true if opt_false is undefined this is used to define why it true of false depending on the value
 * @param {recoil.ui.message.Message=} opt_false
 * @constructor
 */
recoil.ui.BoolWithExplaination = function(val, opt_true, opt_false) {
    this.val_ = val;
    if (opt_false === undefined && opt_true !== undefined) {
        this.true_ = val ? opt_true : null;
        this.false_ = !val ? opt_true : null;

    }
    else {
        this.true_ = opt_true ? opt_true : null;
        this.false_ = opt_false ? opt_false : null;
    }
};

/**
 * @final
 * @type {!recoil.ui.BoolWithExplaination}
 */
recoil.ui.BoolWithExplaination.TRUE = new recoil.ui.BoolWithExplaination(true);
/**
 * @final
 * @type {!recoil.ui.BoolWithExplaination}
 */
recoil.ui.BoolWithExplaination.FALSE = new recoil.ui.BoolWithExplaination(false);


/**
 * @return {boolean}
 */
recoil.ui.BoolWithExplaination.prototype.val = function() {
    return this.val_;
};

/**
 * @return {?recoil.ui.message.Message}
 */
recoil.ui.BoolWithExplaination.prototype.reason = function() {
    return this.val_ ? this.true_ : this.false_;
};


/**
 *
 * @param {...!recoil.ui.BoolWithExplaination} var_values
 * @return {!recoil.ui.BoolWithExplaination}
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
        return new recoil.ui.BoolWithExplaination(true, recoil.ui.messages.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplaination(false, null, recoil.ui.messages.join(falseExplain));
    }
};

/**
 *
 * @param {recoil.frp.Frp} frp
 * @param {...(recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination> | !recoil.ui.BoolWithExplaination)} var_behaviours
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>}
 */
recoil.ui.BoolWithExplaination.and = function(frp, var_behaviours) {
    recoil.util.notNull(arguments);
    var behaviours = new recoil.frp.Util(frp).arrayToBehaviours(1, arguments);

    if (behaviours.length > 0) {
        return recoil.util.invokeParamsAndArray(frp.liftB, frp, function(arg1) {
            return recoil.util.invokeParamsAndArray(arg1.and, arg1, goog.array.slice(arguments, 1));
        }, behaviours);
    }
    return frp.createConstB(recoil.ui.BoolWithExplaination.TRUE);
};

/**
 *
 * @param {recoil.frp.Frp} frp
 * @param {recoil.frp.Behaviour<!boolean>|!boolean} val
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>}
 */
recoil.ui.BoolWithExplaination.fromBool = function(frp, val) {
    return frp.liftB(function(b) {
        return new recoil.ui.BoolWithExplaination(b);
    },new recoil.frp.Util(frp).toBehaviour(val));
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
        return new recoil.ui.BoolWithExplaination(true, recoil.ui.messages.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplaination(false, null, recoil.ui.messages.join(falseExplain));
    }
};

/**
 *
 * @return {!recoil.ui.BoolWithExplaination}
 */
recoil.ui.BoolWithExplaination.prototype.not = function() {
    return new recoil.ui.BoolWithExplaination(!this.val_, this.false_, this.true_);
};

/**
 * @private
 * @param {Array<!recoil.ui.message.Message>} all
 * @param {!boolean} shouldAdd
 * @param {recoil.ui.message.Message} explain
 */
recoil.ui.BoolWithExplaination.prototype.addExplain_ = function(all, shouldAdd, explain) {
    if (shouldAdd && explain) {
        all.push(explain);
    }
};
