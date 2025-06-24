// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: AvlTree.
 *
 *
 * This file provides the implementation of an AVL-Tree datastructure. The tree
 * maintains a set of unique values in a sorted order. The values can be
 * accessed efficiently in their sorted order since the tree enforces an O(logn)
 * maximum height. See http://en.wikipedia.org/wiki/Avl_tree for more detail.
 *
 * The big-O notation for all operations are below:
 * <pre>
 *   Method                 big-O
 * ----------------------------------------------------------------------------
 * - add                    O(logn)
 * - remove                 O(logn)
 * - clear                  O(1)
 * - contains               O(logn)
 * - indexOf                O(logn)
 * - getCount               O(1)
 * - getMinimum             O(1), or O(logn) when optional root is specified
 * - getMaximum             O(1), or O(logn) when optional root is specified
 * - getHeight              O(1)
 * - getValues              O(n)
 * - inOrderTraverse        O(logn + k), where k is number of traversed nodes
 * - reverseOrderTraverse   O(logn + k), where k is number of traversed nodes
 * </pre>
 */


/**
 * String comparison function used to compare values in the tree. This function
 * is used by default if no comparator is specified in the tree's constructor.
 *
 * @param {T} a The first value.
 * @param {T} b The second value.
 * @return {number} -1 if a < b, 1 if a > b, 0 if a = b.
 * @template T
 * @const
 */
const DEFAULT_COMPARATOR = function(a:any, b:any):number {
    if (String(a) < String(b)) {
        return -1;
    } else if (String(a) > String(b)) {
        return 1;
    }
    return 0;
};


class Node<Type> {
    value: Type;
    parent: Node<Type>;
    left: Node<Type>;
    right: Node<Type>;
    count:number;
    height:number;
    
    /**
     * Constructs an AVL-Tree node with the specified value. If no parent is
     * specified, the node's parent is assumed to be null. The node's height
     * defaults to 1 and its children default to null.
     *
     */
    constructor(value:Type, opt_parent?:Node<Type> = null) {
        this.value = value;
        this.parent = opt_parent;
        this.count = 1;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
    
    isRightChild():boolean {
        return !!this.parent && this.parent.right == this;
    }
    
    isLeftChild():boolean {
        return !!this.parent && this.parent.left == this;
    }
    
    
    /**
     * Helper method to fix the height of this node (e.g. after children have
     * changed).
     */
    fixHeight() {
        this.height = Math.max(
            this.left ? this.left.height : 0,
            this.right ? this.right.height : 0) +
            1;
    }
    
};


/**
 * Constructs an AVL-Tree, which uses the specified comparator to order its
 * values. The values can be accessed efficiently in their sorted order since
 * the tree enforces a O(logn) maximum height.
 *
 */
export class AvlTree<Type> {
    private readonly comparator_:(x:Type,y:Type) => number;
    private root_: Node<Type>;
    private minNode_: Node<Type> = null;
    private maxNode_: Node<Type> = null;
    
    
    constructor(opt_comparator?:(x: Type, y: Type) => number) {
        this.comparator_ = opt_comparator || DEFAULT_COMPARATOR;
        this.root_ = null;
    }
    
    findFirst(value:Type) : Type {
        var me = this;
        var found = null;
        this.inOrderTraverse(function(travNode) {
            if (me.comparator_(travNode, value ) === 0) {
                found = travNode;
                
            }
            return true;
        }, value);
        return found;
    }
    
    height(node:Node<Type>):number {
        return node ? node.height : 0;
    }
    
    
    balanceFactor(node:Node<Type>):number {
        if (node) {
            var lh = node.left ? node.left.height : 0;
            var rh = node.right ? node.right.height : 0;
            return lh - rh;
        }
        return 0;
    }

    private balance_(node:Node<Type>):Node<Type> {
        let bf = balanceFactor(node);
        if (bf > 1) {
            if (balanceFactor(node.left) < 0) {
                asserts.assert(node.left);
                this.leftRotate_(node.left);
            }
            return this.rightRotate_(node);
        } else if (bf < -1) {
            if (balanceFactor(node.right) > 0) {
                asserts.assert(node.right);
                this.rightRotate_(node.right);
            }
            return this.leftRotate_(node);
        }
        return node;
    }
    


    /**
     * Recursively find the correct place to add the given value to the tree.
     *
     * @param {T} value
     * @param {!Node<T>} currentNode
     * @return {boolean}
     */
    private addInternal_(value:Type, currentNode:Node<Type>): boolean {
        let comparison = this.comparator_(value, currentNode.value);
        let added = false;
        
        if (comparison > 0) {
            if (currentNode.right) {
                added = this.addInternal_(value, currentNode.right);
            } else {
                currentNode.right = new Node(value, currentNode);
                added = true;
                
                if (currentNode == this.maxNode_) {
                    this.maxNode_ = currentNode.right;
                }
            }
        } else if (comparison < 0) {
            if (currentNode.left) {
                added = this.addInternal_(value, currentNode.left);
            } else {
                currentNode.left = new Node(value, currentNode);
                added = true;
                
                if (currentNode == this.minNode_) {
                    this.minNode_ = currentNode.left;
                }
            }
        }
        
        if (added) {
            currentNode.count++;
            currentNode.height =
                Math.max(height(currentNode.left), height(currentNode.right)) + 1;
            
            this.balance_(currentNode);
        }
        
        return added;
    }
    

    /**
     * Inserts a node into the tree with the specified value if the tree does
     * not already contain a node with the specified value. If the value is
     * inserted, the tree is balanced to enforce the AVL-Tree height property.
     *
     */
    add(value:Type):boolean {
        // If the tree is empty, create a root node with the specified value
        if (!this.root_) {
            this.root_ = new Node(value);
            this.minNode_ = this.root_;
            this.maxNode_ = this.root_;
            return true;
        }
        
        return this.addInternal_(value, this.root_);
    }
    

    count(node) {
        return node ? node.count : 0;
    }
    
    
    /**
     * @return {{value: (T|null), root: ?Node<T>}} The value that was removed or
     *     null if nothing was removed in addition to the root of the modified
     *     subtree.
     */
    private removeInternal_(value:Type, currentNode:xxxx) {
        if (!currentNode) {
            return {value: null, root: null};
        }
        
        let comparison = this.comparator_(currentNode.value, value);
        
        if (comparison > 0) {
            let removeResult = this.removeInternal_(value, currentNode.left);
            currentNode.left = removeResult.root;
            value = removeResult.value;
        } else if (comparison < 0) {
            let removeResult = this.removeInternal_(value, currentNode.right);
            currentNode.right = removeResult.root;
            value = removeResult.value;
        } else {
            value = currentNode.value;
            if (!currentNode.left || !currentNode.right) {
                // Zero or one children.
                let replacement = currentNode.left ? currentNode.left : currentNode.right;
                
                if (!replacement) {
                    if (this.maxNode_ == currentNode) {
                        this.maxNode_ = currentNode.parent;
                    }
                    if (this.minNode_ == currentNode) {
                        this.minNode_ = currentNode.parent;
                    }
                    return {value: value, root: null};
                }
                
                if (this.maxNode_ == currentNode) {
                    this.maxNode_ = replacement;
                }
                if (this.minNode_ == currentNode) {
                    this.minNode_ = replacement;
                }
                
                replacement.parent = currentNode.parent;
                currentNode = replacement;
            } else {
                value = currentNode.value;
                let nextInOrder = currentNode.right;
                // Two children. Note this cannot be the max or min value. Find the next
                // in order replacement (the left most child of the current node's right
                // child).
                this.traverse_(function(node) {
                    if (node.left) {
                        nextInOrder = node.left;
                        return nextInOrder;
                    }
                    return null;
                }, currentNode.right);
                asserts.assert(nextInOrder);
                currentNode.value = nextInOrder.value;
                let removeResult = this.removeInternal_(
                    /** @type {?} */ (nextInOrder.value), currentNode.right);
                currentNode.right = removeResult.root;
            }
        }

        currentNode.count = count(currentNode.left) + count(currentNode.right) + 1;
        currentNode.height =
            Math.max(height(currentNode.left), height(currentNode.right)) + 1;
        return {root: this.balance_(currentNode), value: value};
    }

    
    /**
     * Removes a node from the tree with the specified value if the tree contains a
     * node with this value. If a node is removed the tree is balanced to enforce
     * the AVL-Tree height property. The value of the removed node is returned.
     *
     * @param value Value to find and remove from the tree.
     * @return The value of the removed node or null if the value was not in
     *     the tree.
     * @override
     */
    remove(value:Type):Type {
        let result = this.removeInternal_(value, this.root_);
        this.root_ = result.root;
        return result.value;
    };


    /**
     * Removes all nodes from the tree.
     */
    clear() {
        this.root_ = null;
        this.minNode_ = null;
        this.maxNode_ = null;
    }
    

    /**
     * Returns true if the tree contains a node with the specified value, false
     * otherwise.
     *
     * @param {T} value Value to find in the tree.
     * @return {boolean} Whether the tree contains a node with the specified value.
     * @override
     */
    contains(value:Type):boolean {
        // Assume the value is not in the tree and set this value if it is found
        let isContained = false;
        
        // Depth traverse the tree and set isContained if we find the node
        this.traverse_((node) => {
            let retNode = null;
            let comparison = this.comparator_(node.value, value);
            if (comparison > 0) {
                retNode = node.left;
            } else if (comparison < 0) {
                retNode = node.right;
            } else {
                isContained = true;
            }
            return retNode;  // If null, we'll stop traversing the tree
        });
        
        // Return true if the value is contained in the tree, false otherwise
        return isContained;
    }
    
    
    /**
     * Returns the index (in an in-order traversal) of the node in the tree with
     * the specified value. For example, the minimum value in the tree will
     * return an index of 0 and the maximum will return an index of n - 1 (where
     * n is the number of nodes in the tree).  If the value is not found then -1
     * is returned.
     *
     * @param {T} value Value in the tree whose in-order index is returned.
     * @return {number} The in-order index of the given value in the
     *     tree or -1 if the value is not found.
     */
    indexOf(value:Type):number {
        // Assume the value is not in the tree and set this value if it is found
        let retIndex = -1;
        let currIndex = 0;
        
        // Depth traverse the tree and set retIndex if we find the node
        this.traverse_(node => {
            let comparison = this.comparator_(node.value, value);
            if (comparison > 0) {
                // The value is less than this node, so recurse into the left subtree.
                return node.left;
            }

            if (node.left) {
                // The value is greater than all of the nodes in the left subtree.
                currIndex += node.left.count;
            }
            
            if (comparison < 0) {
                // The value is also greater than this node.
                currIndex++;
                // Recurse into the right subtree.
                return node.right;
            }
            // We found the node, so stop traversing the tree.
            retIndex = currIndex;
            return null;
        });
        
        // Return index if the value is contained in the tree, -1 otherwise
        return retIndex;
    }


    /**
     * Returns the number of values stored in the tree.
     *
     * @return {number} The number of values stored in the tree.
     * @override
     */
    getCount():number {
        return this.root_ ? this.root_.count : 0;
    }
    

    /**
     * Returns a k-th smallest value, based on the comparator, where 0 <= k <
     * this.getCount().
     * @param {number} k The number k.
     * @return {T} The k-th smallest value.
     */
    getKthValue(k:number):Type {
        if (k < 0 || k >= this.getCount()) {
            return null;
        }
        return this.getKthNode_(k).value;
    }

    
    /**
     * Returns the value u, such that u is contained in the tree and u < v, for all
     * values v in the tree where v != u.
     *
     * @return {T} The minimum value contained in the tree.
     */
    getMinimum():Type {
        return this.getMinNode_().value;
    };


    /**
     * Returns the value u, such that u is contained in the tree and u > v, for all
     * values v in the tree where v != u.
     *
     * @return {T} The maximum value contained in the tree.
     */
    getMaximum():Type {
        return this.getMaxNode_().value;
    };


    /**
     * Returns the height of the tree (the maximum depth). This height should
     * always be <= 1.4405*(Math.log(n+2)/Math.log(2))-1.3277, where n is the
     * number of nodes in the tree.
     *
     * @return {number} The height of the tree.
     */
    getHeight():number {
        return this.root_ ? this.root_.height : 0;
    };
    

    /**
     * Inserts the values stored in the tree into a new Array and returns the Array.
     *
     * @return {!Array<T>} An array containing all of the trees values in sorted
     *     order.
     */
    getValues():Type[] {
        let ret = [];
        this.inOrderTraverse(function(value) { ret.push(value); });
        return ret;
    };

    
    /**
     * Performs an in-order traversal of the tree and calls `func` with each
     * traversed node, optionally starting from the smallest node with a value >= to
     * the specified start value. The traversal ends after traversing the tree's
     * maximum node or when `func` returns a value that evaluates to true.
     *
     * @param {Function} func Function to call on each traversed node.
     * @param {T=} opt_startValue If specified, traversal will begin on the node
     *     with the smallest value >= opt_startValue.
     */
    inOrderTraverse(func:(v:Type)=> any, opt_startValue:Type = null) {
        // If our tree is empty, return immediately
        if (!this.root_) {
            return;
        }
        
        // Depth traverse the tree to find node to begin in-order traversal from
        /** @type {undefined|!Node} */
        let startNode;
        if (opt_startValue !== undefined) {
            this.traverse_(node => {
                let retNode = null;
                let comparison = this.comparator_(node.value, opt_startValue);
                if (comparison > 0) {
                    retNode = node.left;
                    startNode = node;
                } else if (comparison < 0) {
                    retNode = node.right;
                } else {
                    startNode = node;
                }
                return retNode;  // If null, we'll stop traversing the tree
            });
            if (!startNode) {
                return;
            }
        } else {
            startNode = /** @type {!Node} */ (this.getMinNode_());
        }
        
        // Traverse the tree and call func on each traversed node's value
        let node = /** @type {!Node} */ (startNode);
        let prev = node.left ? node.left : node;
        while (node != null) {
            if (node.left != null && node.left != prev && node.right != prev) {
                node = node.left;
            } else {
                if (node.right != prev) {
                    if (func(node.value)) {
                        return;
                    }
                }
                let temp = node;
                node =
                    node.right != null && node.right != prev ? node.right : node.parent;
                prev = temp;
            }
        }
    }
    

    /**
     * Performs a reverse-order traversal of the tree and calls `func` with
     * each traversed node, optionally starting from the largest node with a value
     * <= to the specified start value. The traversal ends after traversing the
     * tree's minimum node or when func returns a value that evaluates to true.
     *
     * @param func Function to call on each traversed node.
     * @param {T=} opt_startValue If specified, traversal will begin on the node
     *     with the largest value <= opt_startValue.
     */
    reverseOrderTraverse(func: (v:Type) => any, opt_startValue: Type = null) {
        // If our tree is empty, return immediately
        if (!this.root_) {
            return;
        }
        
        // Depth traverse the tree to find node to begin reverse-order traversal from
        let startNode;
        if (opt_startValue !== undefined) {
            this.traverse_((node) => {
                let retNode = null;
                let comparison = this.comparator_(node.value, opt_startValue);
                if (comparison > 0) {
                    retNode = node.left;
                } else if (comparison < 0) {
                    retNode = node.right;
                    startNode = node;
                } else {
                    startNode = node;
                }
                return retNode;  // If null, we'll stop traversing the tree
            });
            if (!startNode) {
                return;
            }
        } else {
            startNode = this.getMaxNode_();
        }
        
        // Traverse the tree and call func on each traversed node's value
        let node = startNode, prev = startNode.right ? startNode.right : startNode;
        while (node != null) {
            if (node.right != null && node.right != prev && node.left != prev) {
                node = node.right;
            } else {
                if (node.left != prev) {
                    if (func(node.value)) {
                        return;
                    }
                }
                let temp = node;
                node = node.left != null && node.left != prev ? node.left : node.parent;
                prev = temp;
            }
        }
    }
    

    /**
     * Performs a traversal defined by the supplied `traversalFunc`. The first
     * call to `traversalFunc` is passed the root or the optionally specified
     * startNode. After that, calls `traversalFunc` with the node returned
     * by the previous call to `traversalFunc` until `traversalFunc`
     * returns null or the optionally specified endNode. The first call to
     * traversalFunc is passed the root or the optionally specified startNode.
     *
     * @param {function(
     *     this:AvlTree<T>,
     *     !Node<T>):?Node<T>} traversalFunc
     * Function used to traverse the tree.
     * @param {Node<T>=} opt_startNode The node at which the
     *     traversal begins.
     * @param {Node<T>=} opt_endNode The node at which the
     *     traversal ends.
     */
    private traverse_(
        traversalFunc, opt_startNode, opt_endNode) {
        let node = opt_startNode ? opt_startNode : this.root_;
        let endNode = opt_endNode ? opt_endNode : null;
        while (node && node != endNode) {
            node = traversalFunc.call(this, node);
        }
    }
    

    /**
     * Performs a left tree rotation on the specified node.
     *
     * @param {!Node<T>} node Pivot node to rotate from.
     * @return {!Node<T>} New root of the sub tree.
     */
    private leftRotate_(node:Node<Type>):Node<Type> {
        // Re-assign parent-child references for the parent of the node being removed
        if (node.isLeftChild()) {
            node.parent.left = node.right;
            node.right.parent = node.parent;
        } else if (node.isRightChild()) {
            node.parent.right = node.right;
            node.right.parent = node.parent;
        } else {
            this.root_ = node.right;
            this.root_.parent = null;
        }
        
        // Re-assign parent-child references for the child of the node being removed
        let temp = node.right;
        node.right = node.right.left;
        if (node.right != null) node.right.parent = node;
        temp.left = node;
        node.parent = temp;
        
        // Update counts.
        temp.count = node.count;
        node.count -= (temp.right ? temp.right.count : 0) + 1;
        
        node.fixHeight();
        temp.fixHeight();
        
        return temp;
    }
    

    /**
     * Performs a right tree rotation on the specified node.
     *
     * @param {!Node<T>} node Pivot node to rotate from.
     * @return {!Node<T>} New root of the sub tree.
     */
    private rightRotate_(node:Node<Type>):Node<Type> {
        // Re-assign parent-child references for the parent of the node being removed
        if (node.isLeftChild()) {
            node.parent.left = node.left;
            node.left.parent = node.parent;
        } else if (node.isRightChild()) {
            node.parent.right = node.left;
            node.left.parent = node.parent;
        } else {
            this.root_ = node.left;
            this.root_.parent = null;
        }
        
        // Re-assign parent-child references for the child of the node being removed
        let temp = node.left;
        node.left = node.left.right;
        if (node.left != null) node.left.parent = node;
        temp.right = node;
        node.parent = temp;
        
        // Update counts.
        temp.count = node.count;
        node.count -= (temp.left ? temp.left.count : 0) + 1;
        
        node.fixHeight();
        temp.fixHeight();

        return temp;
    }


    /**
     * Returns the node in the tree that has k nodes before it in an in-order
     * traversal, optionally rooted at `opt_rootNode`.
     *
     * @param {number} k The number of nodes before the node to be returned in an
     *     in-order traversal, where 0 <= k < root.count.
     * @param {Node<T>=} opt_rootNode Optional root node.
     * @return {Node<T>} The node at the specified index.
     */
    private getKthNode_(k, opt_rootNode:Node<Type> = null):Node<Type> {
        let root = opt_rootNode || this.root_;
        let numNodesInLeftSubtree = root.left ? root.left.count : 0;

        if (k < numNodesInLeftSubtree) {
            return this.getKthNode_(k, root.left);
        } else if (k == numNodesInLeftSubtree) {
            return root;
        } else {
            return this.getKthNode_(k - numNodesInLeftSubtree - 1, root.right);
        }
    }


    /**
     * Returns the node with the smallest value in tree, optionally rooted at
     * `opt_rootNode`.
     *
     * @param {Node<T>=} opt_rootNode Optional root node.
     * @return {Node<T>} The node with the smallest value in
     *     the tree.
     */
    private getMinNode_(opt_rootNode:Node<Type> = null) {
        if (!opt_rootNode) {
            return this.minNode_;
        }
        
        let minNode = opt_rootNode;
        this.traverse_(function(node) {
            let retNode = null;
            if (node.left) {
                minNode = node.left;
                retNode = node.left;
            }
            return retNode;  // If null, we'll stop traversing the tree
        }, opt_rootNode);
        
        return minNode;
    };


    /**
     * Returns the node with the largest value in tree, optionally rooted at
     * opt_rootNode.
     *
     * @param {Node<T>=} opt_rootNode Optional root node.
     * @return {Node<T>} The node with the largest value in
     *     the tree.
     */
    private getMaxNode_(opt_rootNode? : Node<Type>):Node<Type> {
        if (!opt_rootNode) {
            return this.maxNode_;
        }
        
        let maxNode = opt_rootNode;
        this.traverse_(function(node) {
            let retNode = null;
            if (node.right) {
                maxNode = node.right;
                retNode = node.right;
            }
            return retNode;  // If null, we'll stop traversing the tree
        }, opt_rootNode);
        
        return maxNode;
    }
    
    static fromList<Type>(list:[Type], opt_compareFn) {
        var res = new AvlTree(opt_compareFn || recoil.util.object.compare);
        list.forEach(function(v) {
            res.add(v);
        });
        
        return res;
    }
    
    toList():[Type] {
        let res = [];
        
        this.inOrderTraverse(function(v) {
            res.push(v);
        });
        
        return res;
    }
    
    safeFind(val:Type) : Type {
        let res = this.findFirst(val);
        if (res === null) {
            this.add(val);
            return val;
        }
        return res;
    }
    equals(other:any):boolean {
        if (other instanceof AvlTree) {
            var count = other.getCount();
            if (this.getCount() != count) {
                return false;
            }
            
            var myRows = [];
            var otherRows = [];
            this.inOrderTraverse(function(row) {
                myRows.push(row);
            });
            
            other.inOrderTraverse(function(row) {
                otherRows.push(row);
            });
            return recoil.util.object.isEqual(myRows, otherRows);
        }
        return false;
    }
};
