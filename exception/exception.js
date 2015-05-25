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

};

/**
 * @constructor
 * @this {recoil.exception.NoAccessors}
 */
recoil.exception.NoAccessors = function() {

};

/**
 * @constructor
 * @this {recoil.exception.NotInTransaction}
 */
recoil.exception.NotInTransaction = function() {

};

/**
 * @constructor
 * @this {recoil.exception.InvalidState}
 */
recoil.exception.InvalidState = function() {

};
