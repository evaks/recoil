/**
 * an immutable tree structure with nodes and children
 * in no particular order
 */

goog.provide('recoil.structs.Tree');


goog.require('goog.array');
goog.require('goog.object');
goog.require('recoil.util');

/**
 * I would like to make this use a template but the closure compiler
 * throws a stack overflow exception grrr
 * @param {!string} key
 * @param {?} value
 * @param {Array<recoil.structs.Tree>=} opt_children
 * @constructor
 *
 */
recoil.structs.Tree = function(key, value, opt_children) {
    this.value_ = recoil.util.safeFreeze(value);
    this.key_ = key;
    this.keyMap_ = {};
    if (opt_children) {
        var me = this;
        var idx = 0;
        opt_children.forEach(function(child) {
            me.keyMap_[child.key_] = {idx: idx, node: child};
            idx++;
        });
    }
    this.children_ = /** @type {!Array<!recoil.structs.Tree<T>>} */(goog.array.clone(opt_children || []));
};

/**
 *
 * @return {!Array<!recoil.structs.Tree<T>>}
 */
recoil.structs.Tree.prototype.children = function() {
  return this.children_;
};
/**
 * @param {!Array<!string>} path
 * @return {?}
 */
recoil.structs.Tree.prototype.getValue = function(path) {
    var cur = this;

    for (var idx = 0; idx < path.length; idx++) {
        var key = path[idx];
        var entry = cur.keyMap_[key];
        if (!entry) {
            return null;
        }
        cur = entry.node;

    }
    return cur.value_;
};

/**
 * @param {!Array<!string>} path
 * @param {?} val
 * @return {!recoil.structs.Tree}
 */
recoil.structs.Tree.prototype.setValue = function(path, val) {
    var cur = this;
    var seen = [];
    for (var idx = 0; idx < path.length; idx++) {
        var key = path[idx];
        seen.push(cur);
        cur = cur.keyMap_[key];
        if (!cur) {
            return this;
        }
    }
    var res = new recoil.structs.Tree(cur.key_, val, cur.children_);
    for (var i = seen.length - 1; i >= 0; i--) {
        var oldNode = seen[i];
        var newChildren = goog.array.clone(oldNode.node.children_);
        newChildren[oldNode.idx] = res;
        res = new recoil.structs.Tree(cur.key_, val, newChildren);
    }


    return res;
};

/**
 *
 * @return {?}
 */
recoil.structs.Tree.prototype.value = function() {
  return this.value_;
};

/**
 *
 * @return {!string}
 */
recoil.structs.Tree.prototype.key = function() {
  return this.key_;
};

/**
 * Inserts an child at the given index.
 * @param {recoil.structs.Tree<T>} child The object to insert.
 * @param {number=} position The index at which to insert the object.
 *      A negative index is counted from the end of the array.
 * @return {recoil.structs.Tree<T>}
 */
recoil.structs.Tree.prototype.insertChildAt = function(child, position) {
    var newChildren = goog.array.clone(this.children_);
    goog.array.insertAt(newChildren, child, position);
    return new recoil.structs.Tree(this.value_, newChildren);
};

/**
 * removes the first occurrence of a child from the tree
 * @param {?} child
 * @return {recoil.structs.Tree<T>}
 */
recoil.structs.Tree.prototype.removeChild = function(child) {
    var newChildren = goog.array.clone(this.children_);
    goog.array.remove(newChildren, child);
    return new recoil.structs.Tree(this.value_, newChildren);
};

/**
 *
 * @param {number} position
 * @return {recoil.structs.Tree<T>}
 */
recoil.structs.Tree.prototype.removeChildAt = function(position) {
    var newChildren = goog.array.clone(this.children_);
    goog.array.removeAt(newChildren, position);
    return new recoil.structs.Tree(this.value_, newChildren);
};
