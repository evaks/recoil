/**
 * a boolean with an explanation
 * this is useful for enabling and disabling items
 * on the screen and providing a tooltip showing way something is disabled
 */

goog.provide('recoil.ui.BoolWithExplanation');

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
recoil.ui.BoolWithExplanation = function(val, opt_true, opt_false) {
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
 * @type {!recoil.ui.BoolWithExplanation}
 */
recoil.ui.BoolWithExplanation.TRUE = new recoil.ui.BoolWithExplanation(true);
/**
 * @final
 * @type {!recoil.ui.BoolWithExplanation}
 */
recoil.ui.BoolWithExplanation.FALSE = new recoil.ui.BoolWithExplanation(false);


/**
 * @return {boolean}
 */
recoil.ui.BoolWithExplanation.prototype.val = function() {
    return this.val_;
};

/**
 * @return {?recoil.ui.message.Message}
 */
recoil.ui.BoolWithExplanation.prototype.reason = function() {
    return this.val_ ? this.true_ : this.false_;
};

/**
 * @param {!recoil.frp.Behaviour<!boolean>} valB the boolean value
 * @param {(!recoil.frp.Behaviour<!recoil.ui.message.Message>|!recoil.ui.message.Message)=} opt_true the message to display if true
 * @param {(!recoil.frp.Behaviour<!recoil.ui.message.Message>|!recoil.ui.message.Message)=} opt_false the message to display if false
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.ui.BoolWithExplanation.createB = function(valB, opt_true, opt_false) {
    var frp = valB.frp();
    var util = new recoil.frp.Util(frp);
    return valB.frp().liftB(function(val, trueVal, falseVal) {
        return new recoil.ui.BoolWithExplanation(val, trueVal, falseVal);
    }, valB, util.toBehaviour(opt_true), util.toBehaviour(opt_false));
};
/**
 * @param {!recoil.frp.Behaviour<!boolean>} valB the boolean value
 * @param {(!recoil.frp.Behaviour<!recoil.ui.message.Message>|!recoil.ui.message.Message)=} trueM the message to display if true
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.ui.BoolWithExplanation.createTrueB = function(valB, trueM) {
    return recoil.ui.BoolWithExplanation.createB(valB, trueM);
};

/**
 * @param {!recoil.frp.Behaviour<!boolean>} valB the boolean value
 * @param {(!recoil.frp.Behaviour<!recoil.ui.message.Message>|!recoil.ui.message.Message)=} falseM the message to display if false
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.ui.BoolWithExplanation.createFalseB = function(valB, falseM) {
    return recoil.ui.BoolWithExplanation.createB(valB, undefined, falseM);
};

/**
 *
 * @param {...!recoil.ui.BoolWithExplanation} var_values
 * @return {!recoil.ui.BoolWithExplanation}
 */
recoil.ui.BoolWithExplanation.prototype.and = function(var_values) {

    var trueExplain = [];
    var falseExplain = [];


    this.addExplain_(trueExplain, this.val_, this.true_);
    this.addExplain_(falseExplain, !this.val_, this.false_);

    var res = this.val_;
    for (var i = 0; i < arguments.length; i++) {
        this.addExplain_(trueExplain, arguments[i].val_, arguments[i].true_);
        this.addExplain_(falseExplain, !arguments[i].val_, arguments[i].false_);

        res = res && arguments[i].val_;
    }

    if (res) {
        return new recoil.ui.BoolWithExplanation(true, recoil.ui.messages.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplanation(false, null, recoil.ui.messages.join(falseExplain));
    }
};

/**
 *
 * @param {recoil.frp.Frp} frp
 * @param {...(recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation> | !recoil.ui.BoolWithExplanation)} var_behaviours
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.ui.BoolWithExplanation.and = function(frp, var_behaviours) {
    recoil.util.notNull(arguments);
    var behaviours = new recoil.frp.Util(frp).arrayToBehaviours(1, arguments);

    if (behaviours.length > 0) {
        return recoil.util.invokeParamsAndArray(frp.liftB, frp, function(arg1) {
            return recoil.util.invokeParamsAndArray(arg1.and, arg1, goog.array.slice(arguments, 1));
        }, behaviours).setName('BoolWithExplanation.and');
    }
    return frp.createConstB(recoil.ui.BoolWithExplanation.TRUE).setName('BoolWithExplanation.and');
};

/**
 *
 * @param {recoil.frp.Frp} frp
 * @param {recoil.frp.Behaviour<!boolean>|!boolean} val
 * @return {!recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>}
 */
recoil.ui.BoolWithExplanation.fromBool = function(frp, val) {
    return frp.liftB(function(b) {
        return new recoil.ui.BoolWithExplanation(b);
    },new recoil.frp.Util(frp).toBehaviour(val));
};
/**
 * does an or on all the values and explains why it is true of false
 *
 * @param {Array<!recoil.ui.BoolWithExplanation>} var_values
 * @return {recoil.ui.BoolWithExplanation}
 */

recoil.ui.BoolWithExplanation.prototype.or = function(var_values) {
    var trueExplain = [];
    var falseExplain = [];


    this.addExplain_(trueExplain, this.val_, this.true_);
    this.addExplain_(falseExplain, !this.val_, this.false_);

    var res = this.val_;
    for (var i = 0; i < arguments.length; i++) {
        this.addExplain_(trueExplain, arguments[i].val_, arguments[i].true_);
        this.addExplain_(falseExplain, !arguments[i].val_, arguments[i].false_);

        res = res || arguments[i].val_;
    }

    if (res) {
        return new recoil.ui.BoolWithExplanation(true, recoil.ui.messages.join(trueExplain), null);
    }
    else {
        return new recoil.ui.BoolWithExplanation(false, null, recoil.ui.messages.join(falseExplain, recoil.ui.messages.OR));
    }
};

/**
 *
 * @return {!recoil.ui.BoolWithExplanation}
 */
recoil.ui.BoolWithExplanation.prototype.not = function() {
    return new recoil.ui.BoolWithExplanation(!this.val_, this.false_, this.true_);
};

/**
 * @private
 * @param {Array<!recoil.ui.message.Message>} all
 * @param {!boolean} shouldAdd
 * @param {recoil.ui.message.Message} explain
 */
recoil.ui.BoolWithExplanation.prototype.addExplain_ = function(all, shouldAdd, explain) {
    if (shouldAdd && explain) {
        all.push(explain);
    }
};
