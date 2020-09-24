goog.provide('recoil.frp.VisibleObserver');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.math.Long');
goog.require('goog.structs.AvlTree');
goog.require('goog.style');
goog.require('recoil.exception.NotInDom');
goog.require('recoil.util.Sequence');
/**
 * @constructor
 *
 */
recoil.frp.VisibleObserver = function() {

    this.watched_ = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);
    /**
     * @private
     * @type {goog.structs.AvlTree<recoil.frp.VisibleObserver.State_>}
     */
    this.states_ = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

    this.observer_ = new MutationObserver(recoil.frp.VisibleObserver.observeFunc_(this));
    this.forceReconnect_ = false;
    this.removedNodes_ = new WeakMap();

    if (recoil.frp.VisibleObserver.InsertionWatcher_ === null) {
        // maybe we should use a weak map here we can get rid of the $.recoil.watcher
        var addRec = function(node, seen, depth) {
            var toAdds = node['$.recoil.watcher'];
            recoil.frp.VisibleObserver.setUniqueDomId_(node);
            if (seen[node.id]) {
                return;
            }

            seen[node.id] = true;
            if (toAdds !== undefined) {
                toAdds.forEach(function(toAdd) {

                    toAdd.observer.listen(node, toAdd.callback);
                });
                delete node['$.recoil.watcher'];
            }

            goog.array.forEach(node.childNodes, function(child) {
                addRec(child, seen, depth + 1);
            });

        };
        recoil.frp.VisibleObserver.InsertionWatcher_ = new MutationObserver(function(mutations) {
            // the mutations may have the same node more than once eliminate this since this is slow
            var seen = {};
            mutations.forEach(function(mutation, index, array) {

                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (!node.id || !seen[node.id]) {
                        if (recoil.frp.VisibleObserver.exists(node)) {
                            addRec(node, seen, 1);
                        }
                    }

                }

            });
        });

        recoil.frp.VisibleObserver.InsertionWatcher_.observe(goog.dom.getDocument(), {childList: true, subtree: true});

     }

};
/**
 * @private
 * @type {MutationObserver}
 */
recoil.frp.VisibleObserver.InsertionWatcher_ = null;



/**
 * the items that go into the binary trees, so we can store nodes along with data
 *
 * @constructor
 * @param {Node} opt_node
 * @private
 */
recoil.frp.VisibleObserver.NodeAndValues_ = function(opt_node) {
    this.node = opt_node || null;
};


/**
 * the items that go into the binary trees, so we can store nodes along with data
 *
 * @constructor
 * @extends {recoil.frp.VisibleObserver.NodeAndValues_}
 * @param {Node} node
 * @param {function(boolean)} callback
 * @private
 */
recoil.frp.VisibleObserver.State_ = function(node, callback) {
    this.node = node;
    this.exists = false;
    this.visible = false;
    this.callbacks = [callback];
    /**
     * @type {Array<Node>}
     */
    this.ancestors = [];
};
goog.inherits(recoil.frp.VisibleObserver.State_, recoil.frp.VisibleObserver.NodeAndValues_);

/**
 *
 * @param {boolean} exists
 * @param {boolean} visible
 */

recoil.frp.VisibleObserver.State_.prototype.update = function(exists, visible) {
    this.exists = exists;
    this.visible = exists && visible;
};

/**
 * @type {Node}
 */

recoil.frp.VisibleObserver.NodeAndValues_.prototype.node = null;

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
            console.error(e);
        }
    });
    return found;
};
/**
 * creates a function that will be called by mutation observer to process the mutations
 *
 * @param {recoil.frp.VisibleObserver} me pointer to this pointer
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
                    state.callbacks.forEach(function(cb) {
                        me.watchForInsertion_(p.node, cb);
                    });
                    me.states_.remove(p);
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
            if (travNode.effected.getCount() !== 0) {
                me.watched_.add(travNode);
            }
            return false;
        });

        // if items removed from watched disconnect and re-add all watched items
        if (toRemove.getCount() !== 0 || me.forceReconnect_) {
            me.forceReconnect_ = false;
            toRemove.inOrderTraverse(function(travNode) {
                    me.watched_.remove(travNode);
                    return false;
            });
            me.observer_.disconnect();
            //since we disconnected we may have lost some changes update the states if needed

            me.states_.inOrderTraverse(function(travNode) {
                me.updateState_(travNode);
                return false;
            });

            me.watched_.inOrderTraverse(function(travNode) {
                me.observe_(travNode.node);
                return false;
            });


        } else {
            // else add new watched items
            toAdd.inOrderTraverse(function(travNode) {
                if (travNode.effected.getCount() !== 0) {
                    me.observe_(travNode.node);
                }
                return false;
            });
        }

    };

};

/**
 * String comparison function used to compare values in the tree. This function is used by default if no comparator is
 * specified in the tree's constructor.
 *
 * @param {T} a The first value.
 * @param {T} b The second value.
 * @return {number} -1 if a < b, 1 if a > b, 0 if a = b.
 * @template T
 * @private
 */
recoil.frp.VisibleObserver.WATCHED_COMPARATOR_ = function(a, b) {
    return a.node.id < b.node.id ? -1 : (a.node.id === b.node.id ? 0 : 1);
};

/**
 * finds a node in the tree, if it is not there return null, otherwise returns the node
 *
 * @private
 * @template T
 * @param {goog.structs.AvlTree<T>} tree
 * @param {Node} node
 * @return {?T}
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
 * finds a node in the watched list, if it is not there return null, otherwise returns the node
 *
 * @private
 * @param {Node} node
 * @throws {recoil.exception.NotInDom}
 * @return {?recoil.frp.VisibleObserver.NodeAndValues_}
 */
recoil.frp.VisibleObserver.prototype.findWatched_ = function(node) {
    return recoil.frp.VisibleObserver.find_(this.watched_, node);
};

/**
 * @private
 * @param {Node} node
 * @return {?recoil.frp.VisibleObserver.State_}
 */
recoil.frp.VisibleObserver.prototype.findState_ = function(node) {
    return (recoil.frp.VisibleObserver.find_(this.states_, node));
};

/**
 * @param {Node} node
 * @param {function(boolean)} callback
 * @private
 */
recoil.frp.VisibleObserver.prototype.watchForInsertion_ = function(node, callback) {

    if (node['$.recoil.watcher'] === undefined) {
        node['$.recoil.watcher'] = [{observer: this, callback: callback}];
    }
    else {
        node['$.recoil.watcher'].push({observer: this, callback: callback});
    }
};
/**
 * @private
 * @param {!recoil.frp.VisibleObserver.State_} state
 * @param {function(boolean)=} opt_callback
 */
recoil.frp.VisibleObserver.prototype.updateState_ = function(state, opt_callback) {
    var wasVisible = state.visible;
    var exists = recoil.frp.VisibleObserver.exists(state.node);
    state.update(exists, recoil.frp.VisibleObserver.visible(state.node));
    if (opt_callback) {
        state.callbacks.push(opt_callback);
    }
    if (wasVisible === state.visible) {
        if (opt_callback) {
            opt_callback(state.visible);
        }
    } else {
        // call all the callbacks for this node since the visible state has
        // changed
        state.callbacks.forEach(function(c) {
            c(state.visible);
        });
    }
};

/**
 * listens to node and fires callback when its visibility has changed if the node is removed from the DOM it will no
 * longer listen, also the node must be in the DOM to observe
 *
 * @param {Node} node
 * @param {function(boolean)} callback
 * @throws {recoil.exception.NotInDom}
 */
recoil.frp.VisibleObserver.prototype.listen = function(node, callback) {
    var cur = node;
    var ancestors = [];
    recoil.frp.VisibleObserver.setUniqueDomId_(node);

    var exists = recoil.frp.VisibleObserver.exists(node);

    if (!exists) {
        callback(false);
        this.watchForInsertion_(node, callback);
        return;
    }
    var state = this.findState_(node);

    if (state !== null) {
        // we are already watching this node so no need to watch it again just
        // add the callback to the callbacks and call it
        this.updateState_(state, callback);
        return;
    }

    while (cur != null) {

        var found;
        found = false;
        recoil.frp.VisibleObserver.setUniqueDomId_(cur);
        ancestors.push(cur);
        this.watched_.inOrderTraverse(function(travNode) {
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
            this.watched_.add(recoil.frp.VisibleObserver.createWatched_(cur, node));
        }
        cur = goog.dom.getParentElement(/** @type {Element} */
        (cur));
    }

    state = new recoil.frp.VisibleObserver.State_(node, callback);
    this.states_.add(state);

    state.update(recoil.frp.VisibleObserver.exists(node), recoil.frp.VisibleObserver.visible(node));
    state.ancestors = ancestors;

    var me = this;
    ancestors.forEach(function(ancestor) {
        me.observe_(ancestor);
    });
    callback(state.visible);
};

/**
 * stops listening to the node, will not call the callback function
 *
 * @param {Node} node
 * @param {function(boolean)} callback
 * @throws {recoil.exception.NotInDom}
 */
recoil.frp.VisibleObserver.prototype.unlisten = function(node, callback) {
    var cur = node;
    var ancestors = [];
    recoil.frp.VisibleObserver.setUniqueDomId_(node);

    var state = this.findState_(node);
    var me = this;

    if (state !== null) {
        for (var i = state.callbacks.length - 1; i >= 0; i--) {
            if (state.callbacks[i] === callback) {
              state.callbacks.splice(i, 1);
              break;
            }
        }
        if (state.callbacks.length == 0) {
          var toRemove = new goog.structs.AvlTree(recoil.frp.VisibleObserver.WATCHED_COMPARATOR_);

          state.ancestors.forEach(function(ancestor) {
            var w = me.findWatched_(ancestor);
            if (w !== null) {
                w.effected.remove({node: cur});
                if (w.effected.getCount() === 0) {
                    toRemove.add(w);
                }
            }
          });

          if (toRemove.getCount() !== 0) {
            toRemove.inOrderTraverse(function(travNode) {
                me.watched_.remove(travNode);
                return false;
            });
           this.states_.remove(state);
           // we can't disconnect the observer here because doing so will mean we will lose all pending
           // changes but we just force the next iteration disconnect and set up its listeners again
           me.forceReconnect_ = true;
          }
        }
    }
    else {
        var callbacks = node['$.recoil.watcher'];
        if (callbacks !== undefined) {
            goog.array.removeIf(callbacks, function(el) {
                return el.callback === callback && el.observer === me;
            });
            if (callbacks.length === 0) {
                delete node['$.recoil.watcher'];
            }
        }
    }
};

/**
 * utility function to create a watched node
 *
 * @private
 * @param {Node} watching the node we are watching
 * @param {Node} effected the node that the visibility of the watched node effects
 * @return {recoil.frp.VisibleObserver.NodeAndValues_}
 */
recoil.frp.VisibleObserver.createWatched_ = function(watching, effected) {
    /** @type {recoil.frp.VisibleObserver.NodeAndValues_} */
    var node = new recoil.frp.VisibleObserver.NodeAndValues_(watching);
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
 * @param {Node} node
 */
recoil.frp.VisibleObserver.prototype.observe_ = function(node) {
    this.observer_.observe(node, /** @type {MutationObserverInit} */
    ({
        attributes: true,
        childList: true,
        attributeFilter: ['style', 'hidden']
    }));
};
//
/**
 * checks to see if a node has been added to the root dom element yet
 *
 * @param {Node} node
 * @return {boolean}
 */
recoil.frp.VisibleObserver.exists = function(node) {
    return goog.dom.contains(goog.dom.getDocument(), node);
};

/**
 * checks to see if a node is visible, it does not care if the node is in the DOM
 *
 * @param {Node} node
 * @return {boolean} true if node and all its ancestors are visible
 */
recoil.frp.VisibleObserver.visible = function(node) {
   var cur = node;
    var visible = true;
    while (cur != null && visible) {
        if (cur.style) {
            visible = cur.style.display !== 'none';
        }
        cur = goog.dom.getParentElement(/** @type {Element} */
        (cur));
    }
    return visible;
};

/**
 * sets the node id if it is not already set to a unique id
 *
 * @private
 * @param {Node} node
 * @return {string} the unique id allocated
 */
recoil.frp.VisibleObserver.setUniqueDomId_ = function(node) {

    if (node === null) {
        return '';
    }
    if (node.id === undefined || node.id === '') {
        node.id = 'recoil.frp.id.' + recoil.frp.VisibleObserver.nextDomId_.next();
    }
    return node.id;
};

/**
 * used for testing to ensure that we are cleaning up memory
 *
 * @return {number} number of nodes we are watching
 */

recoil.frp.VisibleObserver.prototype.getWatchedCount = function() {
    return this.states_.getCount();
};

/**
 * @private
 *
 */
recoil.frp.VisibleObserver.nextDomId_ = new recoil.util.Sequence();
