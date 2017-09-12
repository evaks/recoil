goog.provide('recoil.frp.Debugger');

/**
 * interface that a debugger should implement
 * @interface
 */
recoil.frp.Debugger = function() {};


/**
 * this is called before each node is visited,
 * in order to stop return false,
 * @param {!recoil.frp.Behaviour} node
 * @return {!boolean}
 */
recoil.frp.Debugger.prototype.preVisit = function(node) {};
/**
 * called after the node has been visited
 * @param {!recoil.frp.Behaviour} node
 */
recoil.frp.Debugger.prototype.postVisit = function(node) {};
