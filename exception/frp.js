goog.provide('recoil.exception.frp.NotInDom');
goog.provide('recoil.exception.frp.LoopDetected');

/**
 * @contructor
 * @param {Node} node
 */
recoil.exception.frp.NotInDom = function(node) {
	this._node = node;
};

/**
 * @contructor
 */
recoil.exception.frp.LoopDetected = function() {
};

