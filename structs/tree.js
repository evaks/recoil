/**
 * an immutable tree structure with nodes and children
 * in no particular order
 */

goog.provide('recoil.structs.Tree');


goog.require('goog.object');
goog.require('goog.array');
goog.require('recoil.util')
  
/**
 * @template T
 * @param {T} value
 * @param {Array<recoil.structs.Tree<T>>=} opt_children
 * @constructor
 * 
 */
recoil.structs.Tree = function (value, opt_children) {
   this.value_ = recoil.util.safeFreeze(value);
   this.children_ = /** @type Array<recoil.structs.Tree<T>>=} */(goog.object.createImmutableView(opt_children || []));
};

/**
 * 
 * @return !Array<recoil.structs.Tree<T>>
 */
recoil.structs.Tree.prototype.children = function () {
  return this.children_;  
};
/**
 * 
 * @return T
 */
recoil.structs.Tree.prototype.value = function () {
  return this.value_;  
};

/**
 * Inserts an child at the given index.
 * @param {recoil.structs.Tree<T>} child The object to insert.
 * @param {number=} position The index at which to insert the object. 
 *      A negative index is counted from the end of the array.
 * @return recoil.structs.Tree<T>
 */
recoil.structs.Tree.prototype.insertChildAt = function (child, position) {
    var newChildren = goog.array.clone(this.children_);    
    goog.array.insertAt(newChildren, child, position);
    return new recoil.structs.Tree(this.value_, newChildren);
};

/**
 * removes the first occurrence of a child from the tree
 * @param {T} child
 * @return {recoil.structs.Tree<T>}
 */
recoil.structs.Tree.prototype.removeChild = function (child) {
    var newChildren = goog.array.clone(this.children_);    
    goog.array.remove(newChildren, child);
    return new recoil.structs.Tree(this.value_, newChildren);
};

/**
 * 
 * @param {number} position
 * @return {recoil.structs.Tree<T>}
 */
recoil.structs.Tree.prototype.removeChildAt = function (position) {
    var newChildren = goog.array.clone(this.children_);    
    goog.array.removeAt(newChildren, position);
    return new recoil.structs.Tree(this.value_, newChildren);
};