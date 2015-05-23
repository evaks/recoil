goog.provide('recoil.exception.frp.LoopDetected');
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

