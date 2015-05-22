goog.provide('recoil.structs.UniquePriorityQueue');

goog.require('goog.structs.AvlTree');

/**
 * Constructs a Priority Queue that if an item with the same priority is
 * already in the queue is added then nothing is done
 *
 * @template T
 * @param {function(T,T):number} comparator Function used to order the tree's nodes.
 * @constructor
 */

recoil.structs.UniquePriorityQueue = function(comparator) {
    this._tree = new goog.structs.AvlTree(comparator);
};

/**
 * add a value to the queue unless it already exists
 *
 * @template T
 * @param {T} value Value to insert into the tree.
 * @return {boolean} Whether value was inserted into the tree.
 */

recoil.structs.UniquePriorityQueue.prototype.push = function push(value) {
    if (this._tree.contains(value)) {
        return false;
    }
    

    return this._tree.add(value);
};

/**
 * remove an item from the queue, returns undefined if empty
 *
 * @return {T}
 */

recoil.structs.UniquePriorityQueue.prototype.pop = function() {
    if (this._tree.getCount() === 0) {
        return undefined;
    }
    var val = this._tree.getMinimum();

    this._tree.remove(val);
    return val;
};
