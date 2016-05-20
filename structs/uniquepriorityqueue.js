goog.provide('recoil.structs.UniquePriorityQueue');

goog.require('goog.structs.AvlTree');

/**
 * Constructs a Priority Queue that if an item with the same priority is already in the queue is added then nothing is
 * done
 *
 * @template T
 * @param {function(T,T):number} comparator Function used to order the tree's nodes.
 * @constructor
 */

recoil.structs.UniquePriorityQueue = function(comparator) {
    this.tree_ = new goog.structs.AvlTree(comparator);
};

/**
 * add a value to the queue unless it already exists
 *
 * @template T
 * @param {T} value Value to insert into the tree.
 * @return {boolean} Whether value was inserted into the tree.
 */

recoil.structs.UniquePriorityQueue.prototype.push = function push(value) {
    if (this.tree_.contains(value)) {
        return false;
    }

    return this.tree_.add(value);
};


/**
 * remove an item from the queue, specified item
 *
 * @param {T} val
 * @return {T} the node removed null if does not exist
 */

recoil.structs.UniquePriorityQueue.prototype.remove = function(val) {
    return this.tree_.remove(val);
};

/**
 * remove an item from the queue, returns undefined if empty
 *
 * @return {T}
 */

recoil.structs.UniquePriorityQueue.prototype.pop = function() {
    if (this.tree_.getCount() === 0) {
        return undefined;
    }
    var val = this.tree_.getMinimum();

    this.tree_.remove(val);
    return val;
};

/**
 * see if the queue is empty
 *
 * @return {boolean}
 */

recoil.structs.UniquePriorityQueue.prototype.isEmpty = function() {
    return this.tree_.getCount() === 0;
};
