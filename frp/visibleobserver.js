goog.provide('recoil.frp.VisibleObserver');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.math.Long');
goog.require('goog.structs.AvlTree');
goog.require('recoil.exception.frp.NotInDom');

/**
 * the items that goes the trees, so we can store nodes along with data
 * 
 * @interface
 * @private
 */
recoil.frp.VisibleObserver.NodeAndValues_ = function() {
};

/**
 * {Node}
 */
// recoil.frp.VisibleObserver.NodeAndValues_.prototype.node = null;
/**
 * @constructor
 * 
 */
recoil.frp.VisibleObserver = function() {

    this._watched = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);
    this._states = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

    this._observer = new MutationObserver(recoil.frp.VisibleObserver.observeFunc_(this));

};

/**
 * @param {Array <MutationRecord>} mutations
 * @private
 * @return {goog.structs.AvlTree} map of observed nodes that may have changed
 */
recoil.frp.VisibleObserver.prototype.findChangedNodes_ = function(mutations) {
    var found = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

    var me = this;
    var addFound = function(el) {
        if (!found.contains(el)) {
            found.add(el);
        }
    };

    var addAllFound = function(el) {
        if (el == undefined || el.id === undefined || el.id == '') {
            return;
        }
        var watched = me.findWatched_(el);
        if (watched != null) {
            watched.effected.inOrderTraverse(addFound);
        }

    };

    mutations.forEach(function(mutation, index, array) {
        try {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                addAllFound(mutation.addedNodes[i]);
            }
            for (var i = 0; i < mutation.removedNodes.length; i++) {
                addAllFound(mutation.removedNodes[i]);
            }

            var watched = me.findWatched_(mutation.target);

            if (mutation.type === 'attributes') {
                if (mutation.attributeName !== null && watched !== null) {
                    addAllFound(mutation.target);
                }
            }
        } catch (e) {
            console.log(e);
        }
    });
    return found;
};
/**
 * creates a function that will be called by mutation observer to process the
 * mutations
 * 
 * @param {recoil.frp.VisibleObserver}
 *            me pointer to this pointer
 * @return {function(Array <MutationRecord>)} callback for mutation observer
 * @private
 * 
 */
recoil.frp.VisibleObserver.observeFunc_ = function(me) {
    return function(mutations) {
        var found = me.findChangedNodes_(mutations);
        var toRemove = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);
        var toAdd = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

        // for each effected node that may have changed
        found.inOrderTraverse(function(p) {
            var state = me.findState_(p.node);
            if (state !== null) {
                var exists = recoil.frp.VisibleObserver.exists(p.node);
                var visible = exists ? recoil.frp.VisibleObserver.visible(p.node) : false;

                if (state.visible !== visible) {
                    state.callbacks.forEach(function(cb) {
                        cb(visible);
                    });
                    state.visible = visible;
                }

                var cur = p.node;
                var newAncestors = [];
                var oldAncestors = state.ancestors;
                // calculate new ancestors

                if (exists) {
                    while (cur != null) {
                        recoil.frp.VisibleObserver.setUniqueDomId_(cur);
                        var index = state.ancestors.indexOf(cur);
                        if (index === -1) {
                            var w = me.findWatched_(cur);
                            if (w === null) {
                                w = recoil.frp.VisibleObserver.find_(toAdd, cur);
                                if (w === null) {
                                    toAdd.add(recoil.frp.VisibleObserver.createWatched_(cur, p.node));
                                } else {
                                    w.effected.add({
                                        node: p.node
                                    });
                                }
                            } else {
                                w.effected.add(p);
                            }

                        }
                        newAncestors.push(cur);
                        cur = goog.dom.getParentElement(cur);
                    }
                } else {
                    // if the node doesn't exist we simply want to remove it
                    // otherwise we will get
                    // memory leaks
                    me._states.remove(p);
                }

                // remove this node from effected if needed
                oldAncestors.forEach(function(cur) {
                    var index = newAncestors.indexOf(cur);
                    if (index === -1) {
                        var w = me.findWatched_(cur);
                        if (w !== null) {
                            w.effected.remove(p);
                            if (w.effected.getCount() === 0) {
                                toRemove.add(w);
                            }
                        }
                    }

                });
                state.ancestors = newAncestors;
                // if so mark them for possible removal from watched
                // add new watched items

            }

        });

        // add the nodes we need to watched
        toAdd.inOrderTraverse(function(travNode) {
            if (travNode.effected.length !== 0) {
                me._watched.add(travNode);
            }
            return false;
        });

        // if items removed from watched disconnect and re-add all watched items
        if (toRemove.getCount() !== 0) {
            me._observer.disconnect();
            toRemove.inOrderTraverse(function(travNode) {
                me._watched.remove(travNode);
                return false;
            });
            me._watched.inOrderTraverse(function(travNode) {
                me.observe_(travNode.node);
                return false;
            });
        } else {
            // else add new watched items
            toAdd.inOrderTraverse(function(travNode) {
                if (travNode.effected.length !== 0) {
                    me.observe_(travNode.node);
                }
                return false;
            });
        }

    };

};

/**
 * String comparison function used to compare values in the tree. This function
 * is used by default if no comparator is specified in the tree's constructor.
 * 
 * @param {T}
 *            a The first value.
 * @param {T}
 *            b The second value.
 * @return {number} -1 if a < b, 1 if a > b, 0 if a = b.
 * @template T
 * @private
 */
recoil.frp.VisibleObserver.WATCHED_COMPARATOR_ = function(a, b) {
    return a.node.id < b.node.id ? -1 : (a.node.id === b.node.id ? 0 : 1);
};

/**
 * finds a node in the tree, if it is not there return null, otherwise returns
 * the node
 * 
 * @private
 * @param {goog.structs.AvlTree}
 *            tree
 * @param {Node}
 *            node
 * @return {?recoil.frp.VisibleObserver.NodeAndValues_}
 */
recoil.frp.VisibleObserver.find_ = function(tree, node) {
    var found = null;

    if (node.id === undefined || node.id == '') {
        return null;
    }
    tree.inOrderTraverse(function(travNode) {
        if (recoil.frp.VisibleObserver.WATCHED_COMPARATOR_(travNode, {
            node: node
        }) === 0) {
            found = travNode;

        }

        return true;
    }, {
        node: node
    });
    return found;

};

/**
 * finds a node in the watched list, if it is not there return null, otherwise
 * returns the node
 * 
 * @private
 * @param {Node}
 *            node
 * @throws {recoil.exception.frp.NotInDom}
 * @return {?recoil.frp.VisibleObserver.NodeAndValues_}
 */
recoil.frp.VisibleObserver.prototype.findWatched_ = function(node) {
    return recoil.frp.VisibleObserver.find_(this._watched, node);
};

/**
 * @private
 * @param {Node}
 *            node
 * @return {?recoil.frp.VisibleObserver.NodeAndValues_}
 */
recoil.frp.VisibleObserver.prototype.findState_ = function(node) {
    return recoil.frp.VisibleObserver.find_(this._states, node);
};

/**
 * listens to node and fires callback when its visibility has changed if the
 * node is removed from the DOM it will no longer listen, also the node must be
 * in the DOM to observe
 * 
 * @param {Element}
 *            node
 * @param {function(boolean)}
 *            callback
 * @throws {recoil.exception.frp.NotInDom}
 */
recoil.frp.VisibleObserver.prototype.listen = function(node, callback) {
    var cur = node;
    var ancestors = [];
    recoil.frp.VisibleObserver.setUniqueDomId_(node);

    var exists = recoil.frp.VisibleObserver.exists(node);

    if (!exists) {
        throw new recoil.exception.frp.NotInDom(node);
    }
    var state = this.findState_(node);

    if (state !== null) {
        // we are already watching this node so no need to watch it again just
        // add the callback to the callbacks and call it
        var wasVisible = state.visible;
        state.exists = exists;
        state.visible = state.exists && recoil.frp.VisibleObserver.visible(node);
        state.callbacks.push(callback);
        if (wasVisible === state.visible) {
            callback(state.visible);
        } else {
            // call all the callbacks for this node since the visible state has
            // changed
            state.callbacks.forEach(function(c) {
                c(state.visible);
            });
        }
        return;
    }

    while (cur != null) {

        var found;
        found = false;
        recoil.frp.VisibleObserver.setUniqueDomId_(cur);
        ancestors.push(cur);
        this._watched.inOrderTraverse(function(travNode) {
            if (recoil.frp.VisibleObserver.WATCHED_COMPARATOR_(travNode, {
                node: cur
            }) === 0) {
                travNode.effected.add({
                    node: node
                });
                found = true;
            }
            return true;
        }, {
            node: cur
        });

        if (!found) {
            this._watched.add(recoil.frp.VisibleObserver.createWatched_(cur, node));
        }
        cur = goog.dom.getParentElement(cur);
    }
    state = {
        node: node,
        callbacks: [callback]
    };
    this._states.add(state);

    state.exists = recoil.frp.VisibleObserver.exists(node);
    state.visible = state.exists && recoil.frp.VisibleObserver.visible(node);
    state.ancestors = ancestors;

    var me = this;
    ancestors.forEach(function(ancestor) {
        me.observe_(ancestor);
    });
    callback(state.visible);
};

/**
 * utility function to create a watched node
 * 
 * @private
 * @param {Node}
 *            watching the node we are watching
 * @param {Node}
 *            effected the node that the visibility of the watched node effects
 * @return {NodeAndValue}
 */
recoil.frp.VisibleObserver.createWatched_ = function(watching, effected) {
    var node = {
        node: watching
    };
    node.effected = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

    node.effected.add({
        node: effected
    });
    return node;

};

/**
 * helper function to attach to the mutation observer with the correct arguments
 * 
 * @private
 * @param {Node}
 *            node
 */
recoil.frp.VisibleObserver.prototype.observe_ = function(node) {
    this._observer.observe(node, {
        attributes: true,
        childList: true,
        attributeFilter: ['style', 'hidden']
    });
};

/**
 * checks to see if a node has been added to the root dom element yet
 * 
 * @param {Node}
 *            node
 * @return {boolean}
 */
recoil.frp.VisibleObserver.exists = function(node) {
    return goog.dom.getDocument().contains(node);
};

/**
 * checks to see if a node is visible, it does not care if the node is in the
 * DOM
 * 
 * @param {Element}
 *            node
 * @return {boolean} true if node and all its ancestors are visible
 */
recoil.frp.VisibleObserver.visible = function(node) {
    var cur = node;
    var visible = true;
    while (cur != null && visible) {

        visible = !cur.hidden;
        cur = goog.dom.getParentElement(cur);
    }

    return visible;
};

/**
 * sets the node id if it is not already set to a unique id
 * 
 * @private
 * @param {Node}
 *            node
 * @return {string} the unique id allocated
 */
recoil.frp.VisibleObserver.setUniqueDomId_ = function(node) {
    if (node.id === undefined || node.id === '') {
        node.id = 'recoil.frp.id.' + recoil.frp.VisibleObserver.nextDomId_.toString();

        recoil.frp.VisibleObserver.nextDomId_ = recoil.frp.VisibleObserver.nextDomId_.add(goog.math.Long.ONE);
    }
    return node.id;
};

/**
 * used for testing to ensure that we are cleaning up memory
 * 
 * @return {number} number of nodes we are watching
 */

recoil.frp.VisibleObserver.prototype.getWatchedCount = function() {
    return this._states.getCount();
};

/**
 * @private
 * 
 */
recoil.frp.VisibleObserver.nextDomId_ = goog.math.Long.ZERO;
