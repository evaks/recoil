goog.provide('recoil.exception.InvalidState');
goog.provide('recoil.exception.LoopDetected');
goog.provide('recoil.exception.NoAccessors');
goog.provide('recoil.exception.NotAttached');
goog.provide('recoil.exception.NotInDom');
goog.provide('recoil.exception.NotInTransaction');


/**
 * @constructor
 * @param {Node} node
 * @this {recoil.exception.NotInDom}
 */
recoil.exception.NotInDom = function(node) {
    this._node = node;
};

/**
 * @constructor
 * @this {recoil.exception.LoopDetected}
 */
recoil.exception.LoopDetected = function() {

};

/**
 * @constructor
 * @this {recoil.exception.NotAttached}
 */
recoil.exception.NotAttached = function() {
  this.name_ = 'Not Attached';

};

recoil.exception.NotAttached.prototype.toString = function() {
    return this.name_;

};

/**
 * @constructor
 * @this {recoil.exception.NoAccessors}
 */
recoil.exception.NoAccessors = function() {
  this.name_ = 'No Accessors';
};

/**
 * @constructor
 * @this {recoil.exception.NotInTransaction}
 */
recoil.exception.NotInTransaction = function() {
  this.name_ = 'Not In Transaction';
};

/**
 * @constructor
 * @this {recoil.exception.InvalidState}
 */
recoil.exception.InvalidState = function() {

};
