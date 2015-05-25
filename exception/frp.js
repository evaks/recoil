goog.provide('recoil.exception.frp.LoopDetected');
goog.provide('recoil.exception.frp.NoAccessors')
goog.provide('recoil.exception.frp.NotAttached')
goog.provide('recoil.exception.frp.NotInTransaction')
goog.provide('recoil.exception.frp.NotInDom');

/**
 * @constructor
 * @param {Node} node
 * @this {recoil.exception.frp.NotInDom}
 */
recoil.exception.frp.NotInDom = function(node) {
    this._node = node;
};

/**
 * @constructor
 * @this {recoil.exception.frp.LoopDetected}
 */
recoil.exception.frp.LoopDetected = function() {

};

/**
 * @constructor
 * @this {recoil.exception.frp.NotAttached}
 */
recoil.exception.frp.NotAttached = function() {

};

/**
 * @constructor
 * @this {recoil.exception.frp.NoAccessors}
 */
recoil.exception.frp.NoAccessors = function() {

};

/**
 * @constructor
 * @this {recoil.exception.frp.NotInTransaction}
 */
recoil.exception.frp.NotInTransaction = function() {

};

/**
 * @constructor
 * @this {recoil.exception.frp.InvalidState}
 */

recoil.exception.frp.InvalidState = new function() {

};