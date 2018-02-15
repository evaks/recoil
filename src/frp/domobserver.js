goog.provide('recoil.frp.DomObserver');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.math.Long');
goog.require('goog.style');
goog.require('recoil.exception.NotInDom');
goog.require('recoil.util.Sequence');
/**
 * @constructor
 * this watches for insertions and deletions from nodes from the dom
 * it is carefull not to keep references to items not in the
 */
recoil.frp.DomObserver = function() {
    this.observer_ = new MutationObserver(recoil.frp.DomObserver.observeFunc_(this));
    this.watchedNodes_ = new WeakMap();
    this.observer_.observe(goog.dom.getDocument(), {childList: true, subtree: true});
    this.transFunc_ = function(f) {f()};
    if (recoil.frp.DomObserver.instance) {
        console.warn('multiple do observers');
    }
};

/**
 * creates a function that will be called by mutation observer to process the mutations
 *
 * @param {recoil.frp.DomObserver} me pointer to this pointer
 * @return {function(Array <MutationRecord>)} callback for mutation observer
 * @private
 *
 */
recoil.frp.DomObserver.observeFunc_ = function(me) {

    return function(mutations) {
        var seen = new WeakMap(); // not really used as a weak map more as a lookup by node

        var updateAll = function(node, exists) {
            if (seen.get(node)) {
                return;
            }

            var entry = me.watchedNodes_.get(node);

            if (entry && entry.state !== exists) {
                entry.state = exists;
                entry.callbacks.forEach(function(cb) {
                    cb(exists);
                });
            }
            seen.set(node, {exists: exists});
            var children = node.childNodes;
            for (var i = 0; i < children.length; i++) {
                updateAll(children[i], exists);
            }
        };
        me.transFunc_(function() {
            mutations.forEach(function(mutation, index, array) {
                var node;
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    updateAll(node, recoil.frp.DomObserver.exists(node));
                }
                for (i = 0; i < mutation.removedNodes.length; i++) {
                    node = mutation.removedNodes[i];
                updateAll(node, recoil.frp.DomObserver.exists(node));
                }
            });
        });


    };

};
/**
 * sets a function that will be used to group callbacks into 1
 * transaction this is for effeciency
 * @param {!function(!function())} func
 */
recoil.frp.DomObserver.prototype.setTransactionFunc = function(func) {
    this.transFunc_ = func;
};

/**
 * listens to node and fires callback when its visibility has changed if the node is removed from the DOM it will no
 * longer listen, also the node must be in the DOM to observe
 *
 * @param {Node} node
 * @param {function(boolean)} callback
 * @throws {recoil.exception.NotInDom}
 */
recoil.frp.DomObserver.prototype.listen = function(node, callback) {
    var exists = recoil.frp.DomObserver.exists(node);
    var entryOrig = this.watchedNodes_.get(node);
    var entry = entryOrig || {callbacks: [], state: exists};
    var me = this;
    entry.callbacks.push(callback);
    this.transFunc_(function() {
        if (entry.state === exists) {
            callback(exists);
        }
        else {
            entry.state = exists;
            entry.callbacks.forEach(function(cb) {
                cb(exists);
            });
        }
        if (!entryOrig) {
            me.watchedNodes_.set(node, entry);
        }
    });
};
/**
 * gets the behaviours attached to the dom node
 * @param {Node} node
 * @param {Object=} opt_map a map of behaviour id to behaviurs to add to
 *                          for behaviours associated with this node
 * @return {!Object} returns either opt_map or a new map if opt_map is not provided
 */
recoil.frp.DomObserver.prototype.getBehaviours = function(node, opt_map) {
  var map = opt_map || {};

  var entry = this.watchedNodes_.get(node);

  if (entry) {
    entry.callbacks.forEach(function(cb) {
        if (cb.behaviours) {
          cb.behaviours().forEach(function(b) {
            map[b.getUniqId()] = b;
          });
        }
    });
  }
  return map;
};

/**
 * stops listening to the node, will not call the callback function
 *
 * @param {Node} node
 * @param {function(boolean)} callback
 * @throws {recoil.exception.NotInDom}
 */
recoil.frp.DomObserver.prototype.unlisten = function(node, callback) {
    var entry = this.watchedNodes_.get(node) || {callabacks: []};
    for (var i = 0; i < entry.callbacks.length; i--) {
        if (entry.callbacks[i] === callback) {
            entry.callbacks.splice(i, 1);
            break;
        }
    }
    if (entry.callbacks.length === 0) {
        this.watchedNodes_.delete(node);
    }
};


/**
 * checks to see if a node has been added to the root dom element yet
 *
 * @param {Node} node
 * @return {boolean}
 */
recoil.frp.DomObserver.exists = function(node) {
    return goog.dom.contains(goog.dom.getDocument(), node);
};
/**
 * sets the node id if it is not already set to a unique id
 *
 * @private
 * @param {Node} node
 * @return {string} the unique id allocated
 */
recoil.frp.DomObserver.setUniqueDomId_ = function(node) {

    if (node === null) {
        return '';
    }
    if (node.id === undefined || node.id === '') {
        node.id = 'recoil.frp.dom.' + recoil.frp.DomObserver.nextDomId_.next();
    }
    return node.id;
};

/**
 * @private
 *
 */
recoil.frp.DomObserver.nextDomId_ = new recoil.util.Sequence();


/**
 * @public
 * @final
 * @type {!recoil.frp.DomObserver}
 */
recoil.frp.DomObserver.instance = new recoil.frp.DomObserver();
