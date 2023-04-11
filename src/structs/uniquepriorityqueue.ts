import {AvlTree} from "./avltree";

goog.provide('recoil.structs.UniquePriorityQueue');

goog.require('goog.structs.AvlTree');


/**
 * Constructs a Priority Queue that if an item with the same priority is already in the queue is added then nothing is
 * done
 *
 */

export class UniquePriorityQueue<T> {
	tree_: AvlTree<T>;
	constructor(comparator: (x: T, y: T) : number) {
		this.tree_ = new goog.structs.AvlTree(comparator);
	}

	/**
	 * add a value to the queue unless it already exists
	 *
	 * return Whether value was inserted into the tree.
	 */
	
	push(value : T) : boolean {
		if (this.tree_.contains(value)) {
			return false;
		}
		return this.tree_.add(value);
	}


	/**
	 * remove an item from the queue, specified item
	 *
	 * @param {T} val
	 * @return {T} the node removed null if does not exist
	 */
	
	remove = function(val) {
		return this.tree_.remove(val);
	};

	/**
	 * remove an item from the queue, returns undefined if empty
	 */
	
	pop() :T {
		if (this.tree_.getCount() === 0) {
			return undefined;
		}
		var val = this.tree_.getMinimum();
		
		this.tree_.remove(val);
		return val;
	}
	
	/**
	 * return if the queue is empty
	 *
	 */

	isEmpty() : boolean {
		return this.tree_.getCount() === 0;
	}
	

	/**
	 * make pedding queue as an anray
	 *
	 */

	asArray(): Array<T> {
		var res = [];
		this.tree_.inOrderTraverse(function(val) {
			res.push(val);
		});
		return res;
	}
}
