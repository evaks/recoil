/**
 * this provides way of choosing an item, based on another item
 * analogus to an switch statement
 */

goog.provide('recoil.frp.Chooser');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.Util');
goog.require('recoil.util.object');

/**
 * @constructor
 * @template CT, T
 * @param {!recoil.frp.Behaviour<CT>} selectorB this is the value if changes changes which value
 * @param {!recoil.frp.Behaviour<T>|T=} defaultValue
 * gets chosen, I have chosen to make this always be a behaviour, because if it wasn't using the entire
 * class would be pointless
 */

recoil.frp.Chooser = function(selectorB, defaultValue) {
    this.frp_ = selectorB.frp();
    this.util_ = new recoil.frp.Util(this.frp_);
    this.default_ = arguments.length > 1 ? this.util_.toBehaviour(defaultValue) : undefined;
    this.selectorB_ = selectorB;
    this.bound_ = false;
    this.options_ = [];
};

/**
 * add an case to the chooser, note that selectValue is always evalated
 * @param {!recoil.frp.Behaviour<CT>|CT} selectValue
 * @param {!recoil.frp.Behaviour<T>|T} resultValue
 */

recoil.frp.Chooser.prototype.option = function(selectValue, resultValue) {
    if (this.bound_) {
        throw 'Invalid call to option, chooser already bound';
    }
    this.options_.push({select: this.util_.toBehaviour(selectValue), result: this.util_.toBehaviour(resultValue)});
};

/**
 * call this function once you are ready to use the chooser, it converts it into a behaviour
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Chooser.prototype.bind = function() {
    if (this.bound_) {
        throw 'Invalid call to bind, chooser already bound';
    }
    this.bound_ = true;
    var me = this;
    var args = [
        function() {
            for (var i = 0; i < me.options_.length; i++) {
                var opt = me.options_[i];
                if (recoil.util.object.isEqual(opt.select.get(), me.selectorB_.get())) {
                    return new recoil.frp.BStatus(opt.result);
                }
            }
            if (me.default_) {
                return new recoil.frp.BStatus(me.default_);
            }
            return recoil.frp.BStatus.notReady();
        },
        function() {},
        this.selectorB_];
    this.options_.forEach(function(v) {
        args.push(v.select);
    });

    var chooserBB = this.frp_.statusLiftBI.apply(this.frp_, args);
    return this.frp_.switchB(chooserBB);
};
/**
 * @template T
 * @param {!recoil.frp.Behaviour<!boolean>} condition
 * @param {!recoil.frp.Behaviour<T>|T} trueValue
 * @param {!recoil.frp.Behaviour<T>|T} falseValue
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Chooser.if = function(condition, trueValue, falseValue) {
    var chooser = new recoil.frp.Chooser(condition, falseValue);
    chooser.option(true, trueValue);
    return chooser.bind();
};


/**
 * this is a utility whos only purpose is to get rid of warnings
 * if both both true and false are behaviours the compiler doesn't
 * know if the result is a behaviour or a behaviour of a behaviour
 * @template T
 * @param {!recoil.frp.Behaviour<!boolean>} condition
 * @param {!recoil.frp.Behaviour<T>} trueValue
 * @param {!recoil.frp.Behaviour<T>} falseValue
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Chooser.ifB = function(condition, trueValue, falseValue) {
    var chooser = new recoil.frp.Chooser(condition, falseValue);
    chooser.option(true, trueValue);
    return chooser.bind();
};
