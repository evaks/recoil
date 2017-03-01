goog.provide('recoil.db.ChangeDb');
goog.provide('recoil.db.ChangeDbNode');
goog.provide('recoil.db.ChangeSet');
goog.provide('recoil.db.ChangeSet.Add');
goog.provide('recoil.db.ChangeSet.Change');
goog.provide('recoil.db.ChangeSet.Delete');
goog.provide('recoil.db.ChangeSet.Move');
goog.provide('recoil.db.ChangeSet.Path');
goog.provide('recoil.db.ChangeSet.Schema');
goog.provide('recoil.db.ChangeSet.Set');

goog.require('goog.structs.AvlTree');
goog.require('recoil.util.object');


/**
 * @constructor
 */
recoil.db.ChangeSet = function() {
};

/**
 * @constructor
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeDb = function(schema) {
    this.schema_ = schema;
    this.data_ = new recoil.db.ChangeDbNode.Container();
    /**
     * @private
     * @type {!Array<!recoil.db.ChangeSet.Path>}
     */
    this.roots_ = [];
};

/**
 * @param {!Array<!recoil.db.ChangeSet.Change>} changes
 */
recoil.db.ChangeDb.prototype.applyChanges = function(changes) {
    for (var i = 0; i < changes.length; i++) {
        var change = changes[i];
        change.applyToDb(this, this.schema_);
    }
};


/**
 * @param {!recoil.db.ChangeSet.Path} rootPath
 * @param {?} val
 * @return {!Array<!recoil.db.ChangeSet.Path>} returns a list of roots that have changed
 */
recoil.db.ChangeDb.prototype.set = function(rootPath, val) {
    var cur = this.resolve_(rootPath, true);
    var absolutePath = this.schema_.absolute(rootPath);
    cur.set(this.schema_, rootPath, val);
    var found = false;
    var changed = [];
    for (var i = 0; i < this.roots_.length; i++) {
        var root = this.roots_[i];
        found = found || recoil.util.object.isEqual(root, rootPath);
        if (this.schema_.absolute(root).isAncestor(absolutePath, true)) {
            changed.push(root);
        }

    }

    if (!found) {
        this.roots_.push(rootPath);
        changed.push(rootPath);
    }
    return changed;
};

/**
 * @param {!recoil.db.ChangeSet.Path} rootPath
 */
recoil.db.ChangeDb.prototype.remove = function(rootPath) {
    var cur = this.resolve_(rootPath, false);
    if (!cur) {
        return;
    }
    var absolutePath = this.schema_.absolute(rootPath);
    var found = false;

    for (var i = this.roots_.length - 1; i >= 0; i--) {
        var root = this.roots_[i];
        if (recoil.util.object.isEqual(root, rootPath)) {
            this.roots_.splice(i, 1);
        }
        else if (this.schema_.absolute(root).isAncestor(absolutePath, true)) {
            found = true;
        }
    }
    // TODO remove data from the tree no other roots access it
};


/**
 * @private
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!boolean} create
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDb.prototype.resolve_ = function(path, create) {
    var items = this.schema_.absolute(path).items();
    var cur = this.data_;

    for (var i = 0; i < items.length && cur; i++) {
        var item = items[i];
        cur = cur.getChildNode(this.schema_, item, i + 1 == items.length ? path : null, create);
        if (cur && item.keys().length > 0) {
            cur = cur.getChildNode(this.schema_, item, i + 1 == items.length ? path : null, create);
        }
    }
    return cur;
};

/**
 * @param {!recoil.db.ChangeSet.Path} rootPath
 * @return {Object}
 */
recoil.db.ChangeDb.prototype.get = function(rootPath) {
    var fullObj = this.resolve_(rootPath, false);


    if (fullObj === null) {
        return null;
    }
    return fullObj.get(this.schema_, rootPath);
};

/**
 * @param {!Array<recoil.db.ChangeSet.Change>} changes
 */
recoil.db.ChangeSet.prototype.applyChanges = function(changes) {

};

/**
 * @interface
 * @template T
 * allows paths to be compressed/decompressed
 */
recoil.db.ChangeSet.PathCompressor = function() {
};

/**
 * converts a path to an object that can be turned into json
 * @param {!Array<!string>} path
 * @return {T}
 */
recoil.db.ChangeSet.PathCompressor.prototype.compress = function(path) {
};
/**
 * converts a path to an object that can be turned into json
 * @param {T} path
 * @return {!Array<!string>}
 */
recoil.db.ChangeSet.PathCompressor.prototype.decompress = function(path) {
};

/**
 * @constructor
 * @implements {recoil.db.ChangeSet.PathCompressor<!string>}
 */
recoil.db.ChangeSet.DefaultPathCompressor = function() {
};

/**
 * converts a path to an object that can be turned into json
 * @param {!Array<string>} path
 * @return {!string}
 */
recoil.db.ChangeSet.DefaultPathCompressor.prototype.compress = function(path) {
    return path.join('/');
};
/**
 * converts a path to an object that can be turned into json
 * @param {!string} path
 * @return {!Array<!string>}
 */
recoil.db.ChangeSet.DefaultPathCompressor.prototype.decompress = function(path) {
    return path.split('/');
};


/**
 * @interface
 * allows override to serialize/deserialize values, eg buffers
 */
recoil.db.ChangeSet.ValueSerializor = function() {
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 * @return {?}
 */
recoil.db.ChangeSet.ValueSerializor.prototype.serialize = function(path, val) {
};
/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} serialized
 * @return {?}
 */
recoil.db.ChangeSet.ValueSerializor.prototype.deserialize = function(path, serialized) {
};


/**
 * @constructor
 * @implements {recoil.db.ChangeSet.ValueSerializor}
 * allows override to serialize/deserialize values, eg buffers
 */
recoil.db.ChangeSet.DefaultValueSerializor = function() {
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 * @return {?}
 */
recoil.db.ChangeSet.DefaultValueSerializor.prototype.serializeKeys = function(path, val) {
    return val;
};
/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} serialized
 * @return {?}
 */
recoil.db.ChangeSet.DefaultValueSerializor.prototype.deserializeKeys = function(path, serialized) {
    return serialized;
};


/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 * @return {?}
 */
recoil.db.ChangeSet.DefaultValueSerializor.prototype.serialize = function(path, val) {
    return val;
};
/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} serialized
 * @return {?}
 */
recoil.db.ChangeSet.DefaultValueSerializor.prototype.deserialize = function(path, serialized) {
    return serialized;
};

/**
 * @interface
 */
recoil.db.ChangeSet.Change = function() {
};

/**
 * @param {!recoil.db.ChangeDb} db
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet.Change.prototype.applyToDb = function(db, schema) {};

/**
 * returns the number of changes in this change
 * @return {!number}
 */
recoil.db.ChangeSet.Change.prototype.changeCount = function() {};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathChangeMap
 * @param {recoil.db.ChangeSet.Change} pAncestor
 * @param {!Array<!number>} maxPos
 */
recoil.db.ChangeSet.Change.prototype.merge = function(pathChangeMap, pAncestor, maxPos) {};

/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Change.prototype.path = function() {};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathMap
 */
recoil.db.ChangeSet.Change.prototype.sortDesendants = function(pathMap) {};

/**
 * convert all paths to absolute values and returns a copy
 *
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Change.prototype.absolute = function(schema) {};


/**
 * converts a path to an object that can be turned into json
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Change.prototype.serialize = function(keepOld, valSerializor, opt_compressor) {
};
/**
 * @enum {number}
 */
recoil.db.ChangeSet.Change.Type = {
    SET: 0,
    ADD: 1,
    DEL: 2,
    MOVE: 3
};

/**
 * converts a path to an object that can be turned into json
 * @suppress {missingProperties}
 * @param {!Object} object
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Change.deserialize = function(object, schema, valSerializor, opt_compressor) {
    var ChangeType = recoil.db.ChangeSet.Change.Type;
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    if (object.type === ChangeType.MOVE) {
        return new recoil.db.ChangeSet.Move(
            recoil.db.ChangeSet.Path.deserialize(object.from, schema, valSerializor, compressor),
            recoil.db.ChangeSet.Path.deserialize(object.to, schema, valSerializor, compressor));
    }
    if (object.type === ChangeType.DEL) {
        return new recoil.db.ChangeSet.Delete(
            recoil.db.ChangeSet.Path.deserialize(object.path, schema, valSerializor, compressor));
    }
    if (object.type === ChangeType.ADD && object.deps !== undefined) {
        return new recoil.db.ChangeSet.Add(
            recoil.db.ChangeSet.Path.deserialize(object.path, schema, valSerializor, compressor),
            recoil.db.ChangeSet.Change.deserializeList(object.deps, schema, valSerializor, compressor));
    }

    if (object.type === ChangeType.SET) {
        var path = recoil.db.ChangeSet.Path.deserialize(object.path, schema, valSerializor, compressor);
        return new recoil.db.ChangeSet.Set(
            path,
            valSerializor.deserialize(path, object.old), valSerializor.deserialize(path, object.new));

    }


    throw 'unrecogined change type';
};

/**
 * converts a path to an object that can be turned into json
 * @param {!Array<!Object>} object
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.Change.deserializeList = function(object, schema, valSerializor, compressor) {
    var res = [];
    for (var i = 0; i < object.length; i++) {
        res.push(recoil.db.ChangeSet.Change.deserialize(object[i], schema, valSerializor, compressor));
    }
    return res;
};

/**
 * converts a path to an object that can be turned into json
 * @param {!Array<!recoil.db.ChangeSet.Change>} changes
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!Array<!Object>}
 */
recoil.db.ChangeSet.Change.serializeList = function(changes, keepOld, valSerializor, compressor) {
    var res = [];
    for (var i = 0; i < changes.length; i++) {
        res.push(changes[i].serialize(keepOld, valSerializor, compressor));
    }
    return res;
};
/**
 * @interface
 */
recoil.db.ChangeSet.Error = function() {
};

/**
 * @implements {recoil.db.ChangeSet.Error}
 * @constructor
 * @param {!recoil.db.ChangeSet.Path} path
 */
recoil.db.ChangeSet.DupPk = function(path) {
    this.path_ = path;
};



/**
 * @interface
 */
recoil.db.ChangeSet.Schema = function() {
};

/**
 * @param {recoil.db.ChangeSet.Path} path
 * @return {!Array<!string>} the children
 */
recoil.db.ChangeSet.Schema.prototype.children = function(path) {

};


/**
 * @param {recoil.db.ChangeSet.Path} path
 * @return {!boolean} the children
 */
recoil.db.ChangeSet.Schema.prototype.exists = function(path) {

};

/**
 * returns a list of keys at the path level not parent keys
 * @param {recoil.db.ChangeSet.Path} path
 * @return {!Array<!string>} keys
 */
recoil.db.ChangeSet.Schema.prototype.keys = function(path) {

};

/**
 * @param {recoil.db.ChangeSet.Path} path
 * @return {!boolean}
 */
recoil.db.ChangeSet.Schema.prototype.isLeaf = function(path) {

};

/**
 * @param {recoil.db.ChangeSet.Path} path
 * @return {!boolean}
 */
recoil.db.ChangeSet.Schema.prototype.isKeyedList = function(path) {

};

/**
 * converts a path into an absolute path this solve
 * so you can have different paths for the same thing
 *
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Schema.prototype.absolute = function(path) {

};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} obj
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Schema.prototype.createKeyPath = function(path, obj) {

};
/**
 * @param {!string} name
 * @param {!Array<!string>} keyNames the fields in the object the keys belong to
 * @param {!Array<?>} keys
 * @constructor
 */
recoil.db.ChangeSet.PathItem = function(name, keyNames, keys) {
    this.name_ = name;
    this.keys_ = keys;
    this.keyNames_ = keyNames;
};
/**
 * @return {!string}
 */
recoil.db.ChangeSet.PathItem.prototype.name = function() {
    return this.name_;
};

/**
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.PathItem.prototype.keys = function() {
    return this.keys_;
};

/**
 * @return {!recoil.db.ChangeSet.PathItem}
 */
recoil.db.ChangeSet.PathItem.prototype.unsetKeys = function() {
    return new recoil.db.ChangeSet.PathItem(this.name_, [], []);
};

/**
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.PathItem.prototype.keyNames = function() {
    return this.keyNames_;
};

/**
 * @constructor
 * @param {Array<!recoil.db.ChangeSet.PathItem>} items
 */
recoil.db.ChangeSet.Path = function(items) {
    this.items_ = items.slice(0);
};

/**
 * creates from a string no parameters are provided
 *
 * @param {!string} path
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.fromString = function(path) {
    var parts = [];
    path.split('/').forEach(function(part) {
        if (part !== '') {
            parts.push(new recoil.db.ChangeSet.PathItem(part, [], []));
        }
    });
    return new recoil.db.ChangeSet.Path(parts);
};


/**
 * @param {!recoil.db.ChangeSet.PathItem} part
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.append = function(part) {
    return new recoil.db.ChangeSet.Path(
        this.items_.concat(part));
};


/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!boolean} allowSelf
 * @return {!boolean}
 */
recoil.db.ChangeSet.Path.prototype.isAncestor = function(path, allowSelf) {
    if (this.items_.length > path.items_.length) {
        return false;
    }
    if (!allowSelf && this.items_.length === path.items_.length) {
        return false;
    }

    for (var i = 0; i < this.items_.length; i++) {
        if (!recoil.util.object.isEqual(this.items_[i], path.items_[i])) {
            return false;
        }
    }
    return true;
};

/**
 * @param {!string} name
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.appendName = function(name) {
    return this.append(new recoil.db.ChangeSet.PathItem(name, [], []));
};

/**
 * @param {!Array<!string>} names
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.appendNames = function(names) {
    var res = this;
    for (var i = 0; i < names.length; i++) {
        res = res.appendName(names[i]);
    }
    return res;
};



/**
 * @param {!Array<!recoil.db.ChangeSet.PathItem>} parts
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.prepend = function(parts) {
    return new recoil.db.ChangeSet.Path(
        parts.concat(this.items_));
};

/**
 * @param {!number} parts
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.removeFront = function(parts) {
    return new recoil.db.ChangeSet.Path(
        this.items_.slice(parts));
};
/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.parent = function() {
    var parts = [];
    for (var i = 0; i < this.items_.length - 1; i++) {
        parts.push(this.items_[i]);
    }


    return new recoil.db.ChangeSet.Path(
        parts);
};

/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Path.prototype.serialize = function(valSerializor, compressor) {
    var names = [];
    var params = [];
    var curPath = new recoil.db.ChangeSet.Path([]);
    for (var i = 0; i < this.items_.length; i++) {
        names.push(this.items_[i].name());
        curPath = curPath.append(this.items_[i]);
        var keys = this.items_[i].keys();
        var keyNames = this.items_[i].keyNames();

        for (var j = 0; j < keys.length; j++) {
            var keyPath = curPath.appendName(keyNames[j]);
            params.push(valSerializor.serialize(keyPath, keys[j]));
        }
    }
    return {parts: compressor.compress(names), params: params};
};


/**
 * converts a path to an object that can be turned into json
 * @param {!Object} obj
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.deserialize = function(obj, schema, valSerializor, compressor) {
    var parts = compressor.decompress(obj.parts);
    var curPath = new recoil.db.ChangeSet.Path([]);
    var curKey = 0;
    for (var i = 0; i < parts.length; i++) {
        curPath = curPath.append(new recoil.db.ChangeSet.PathItem(parts[i], [], []));
        var keyNames = schema.keys(curPath);
        if (keyNames.length <= obj.params.length - curKey) {
            var keys = [];
            for (var j = 0; j < keyNames.length; j++) {
                keys.push(valSerializor.deserialize(curPath.appendName(keyNames[j]), obj.params[curKey++]));
            }
            curPath = curPath.setKeys(keyNames, keys);
        }
    }

    return curPath;
};




/**
 * @return {!string}
 */
recoil.db.ChangeSet.Path.prototype.toString = function() {
    return '/' + this.parts().join('/') + ':' + this.keys();
};

/**
 * @return {!string}
 */
recoil.db.ChangeSet.Path.prototype.pathAsString = function() {

    return '/' + this.parts().join('/');
};


/**
 * sets the keys on the las child
 * @param {!Array<!string>} keyNames
 * @param {!Array<?>} keyValues
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.setKeys = function(keyNames, keyValues) {
    var newItems = this.items_.slice(0);
    var last = newItems.pop();
    newItems.push(new recoil.db.ChangeSet.PathItem(last.name(), keyNames, keyValues));
    return new recoil.db.ChangeSet.Path(newItems);

};

/**
 * unsets the keys on the las child, although right now does exactly
 * the same setKeys([],[]) later on I may have to support lists with no keys
 *
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.unsetKeys = function() {
    var newItems = this.items_.slice(0);
    var last = newItems.pop();
    newItems.push(last.unsetKeys());
    return new recoil.db.ChangeSet.Path(newItems);

};

/**
 * just the keys of the lastItem
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.Path.prototype.lastKeys = function() {
    if (this.items_.length > 0) {
        return this.items_[this.items_.length - 1].keys();
    }
    return [];
};

/**
 * just the keys of the lastItem
 * @return {!recoil.db.ChangeSet.PathItem}
 */
recoil.db.ChangeSet.Path.prototype.last = function() {
    if (this.items_.length > 0) {
        return this.items_[this.items_.length - 1];
    }
    throw 'path contains no items';
};

/**
 * return all the keys for a path not just the last level
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.Path.prototype.keys = function() {
    var params = [];
    this.items_.forEach(function(item) {
        item.keys().forEach(function(key) {
            params.push(key);
        });
    });
    return params;
};


/**
 * @return {!Array<!string>}
 */
recoil.db.ChangeSet.Path.prototype.parts = function() {
    var parts = [];
    this.items_.forEach(function(item) {
        parts.push(item.name());
    });
    return parts;
};

/**
 * @return {!Array<!recoil.db.ChangeSet.PathItem>}
 */
recoil.db.ChangeSet.Path.prototype.items = function() {
    return this.items_;
};

/**
 * @constructor
 * @implements recoil.db.ChangeSet.Change
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} oldVal
 * @param {?} newVal
 */

recoil.db.ChangeSet.Set = function(path, oldVal, newVal) {
    this.path_ = path;
    this.oldVal_ = oldVal;
    this.newVal_ = newVal;
};


/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Set.prototype.path = function() {
    return this.path_;
};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathMap
 */
recoil.db.ChangeSet.Set.prototype.sortDesendants = function(pathMap) {
};

/**
 * convert all paths to absolute values and returns a copy
 *
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Set.prototype.absolute = function(schema) {
    return new recoil.db.ChangeSet.Set(schema.absolute(this.path_), this.oldVal_, this.newVal_);
};


/**
 * @param {!recoil.db.ChangeDb} db
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet.Set.prototype.applyToDb = function(db, schema) {
    var node = db.resolve_(this.path_, false);
    if (!node) {
        var parent = db.resolve_(this.path_.parent(), false);
        if (!parent) {
            throw "set node '" + this.path_.toString() + "' does not exist";
        }
        node = parent.getChildNode(schema, this.path_.last(), this.path_, true);
    }
    if (!(node instanceof recoil.db.ChangeDbNode.Leaf)) {
        throw "set node '" + this.path_.toString() + "' is not a leaf";
    }
    node.setValue(this.newVal_);
};

/**
 * converts a change an object that can be turned into json
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor serializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Set.prototype.serialize = function(keepOld, valSerializor, opt_compressor) {
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    if (keepOld) {
        return {type: recoil.db.ChangeSet.Change.Type.SET, path: this.path_.serialize(valSerializor, compressor),
                old: valSerializor.serialize(this.path_, this.oldVal_),
                new: valSerializor.serialize(this.path_, this.newVal_)};
    }
    return {type: recoil.db.ChangeSet.Change.Type.SET, path: this.path_.serialize(valSerializor, compressor),
            new: valSerializor.serialize(this.path_, this.newVal_)};
};


/**
 * @constructor
 * @implements recoil.db.ChangeSet.Change
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!Array<!recoil.db.ChangeSet.Change>} dependants
 */

recoil.db.ChangeSet.Add = function(path, dependants) {
    this.path_ = path;
    this.dependants_ = dependants;
};


/**
 * returns the number of changes in this change
 * @return {!number}
 */
recoil.db.ChangeSet.Add.prototype.changeCount = function() {
    var res = 1;
    this.dependants_.forEach(function(d) {
        res += d.changeCount();
    });
    return res;
};

/**
 * invariants
 *
 * for all cur < added
 *   count(set(path)) < 2;
 *   del(path) then no add(path/...) before it
 *   del(path) then no set(path/...) before it
 *   del(path) then no move(_, path/...) before it
 *   add(path)
 */
/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathChangeMap
 * @param {recoil.db.ChangeSet.Change} pAncestor
 * @param {!Array<!number>} maxPos
 */
recoil.db.ChangeSet.Add.prototype.merge = function(pathChangeMap, pAncestor, maxPos) {
    var me = this;

    // set ... add do nothing we can't of set something before we added it
    // add ... add if add is a ancestor add ourselves as a dependant
    // delete ... add this add stays because this could potentually unset other values
    // move ... add(desendant to) move to before move
    // move ... add(desendant from)
    // move ... add(from) that is ok

    var ancestors = pathChangeMap.findAncestors(this.path_);
    var add = null;
    for (var i = ancestors.length - 1; i >= 0; i--) {
        var ancestor = ancestors[i];
        if (ancestor instanceof recoil.db.ChangeSet.Delete) {
            break;
        }
        else if (ancestor instanceof recoil.db.ChangeSet.Move) {
            // adjust path to before move
            if (ancestor.to().isAncestor(this.path_, true)) {
                var newPath = ancestor.beforeMovePath(this.path());
                // we know longer paths are moved before shorter paths
                //
                if (recoil.util.object.isEqual(ancestor.to(), this.path_)) {
                    throw 'add object that already exists';
                }

                var moveInfo = pathChangeMap.findChangeInfo(ancestor);


                // we have to place the set before the move
                new recoil.db.ChangeSet.Add(newPath, this.dependants_)
                    .merge(pathChangeMap, pAncestor, moveInfo.pos);
                return;
            }
        }
        else if (ancestor instanceof recoil.db.ChangeSet.Add) {
            // add this to decendants
            add = ancestor;
            break;
        }
    }
    if (add) {
        ancestor.addDependant(this);
        pathChangeMap.add(this.path_, this, ancestor, maxPos);
    }
    else {
        pathChangeMap.add(this.path_, this, null, maxPos);
    }
    this.dependants_.forEach(function(change) {
        change.merge(pathChangeMap, me, maxPos);
    });

};

/**
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.Add.prototype.dependants = function() {
    return this.dependants_;
};

/**
 * @param {!recoil.db.ChangeSet.Change} dep
 */
recoil.db.ChangeSet.Add.prototype.addDependant = function(dep) {
    for (var i = 0; i < this.dependants_.length; i++) {
        if (dep === this.dependants_[i]) {
            return;
        }
    }
    this.dependants_.push(dep);
};


/**
 * @param {!recoil.db.ChangeSet.Change} dep
 */
recoil.db.ChangeSet.Add.prototype.removeDependant = function(dep) {
    for (var i = 0; i < this.dependants_.length; i++) {
        if (dep === this.dependants_[i]) {
            this.dependants_.splice(i, 1);
            return;
        }
    }
};

/**
 * convert all paths to absolute values and returns a copy
 *
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Add.prototype.absolute = function(schema) {
    var dependants = [];
    this.dependants_.forEach(function(dep) {
        dependants.push(dep.absolute(schema));
    });
    return new recoil.db.ChangeSet.Add(schema.absolute(this.path_), dependants);
};
/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Add.prototype.path = function() {
    return this.path_;
};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathMap
 */
recoil.db.ChangeSet.Add.prototype.sortDesendants = function(pathMap) {
    var dependants = this.dependants_;
    var toSort = [];
    this.dependants_.forEach(function(dep) {
        var info = pathMap.findChangeInfo(dep);
        if (!info) {
            throw 'unable to find change info';
        }
        toSort.push({pos: info.pos, change: dep});
    });
    goog.array.sort(toSort, recoil.db.ChangeSet.PathChangeMap.comparePos);
    var deps = [];
    toSort.forEach(function(v) {
        deps.push(v.change);
    });
    this.dependants_ = deps;
};

/**
 * @param {!recoil.db.ChangeDb} db
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet.Add.prototype.applyToDb = function(db, schema) {
    var listNode;
    if (this.path_.lastKeys().length > 0) {
        // this is a list node we are adding
        listNode = db.resolve_(this.path_.unsetKeys(), false);
        if (!listNode) {
            throw "add node '" + this.path_.unsetKeys().toString() + "' does not exist";
        }
        if (!(listNode instanceof recoil.db.ChangeDbNode.List)) {
            throw "cannot add node '" + this.path_.toString() + "' to non-list";
        }

        var newNode = new recoil.db.ChangeDbNode.Container();
        listNode.add(this.path_.last(), newNode);
        db.applyChanges(this.dependants_);
        return;
    }
    else {
        listNode = db.resolve_(this.path_.parent(), false);

        if (!(listNode instanceof recoil.db.ChangeDbNode.Container)) {
            throw "cannot add node '" + this.path_.toString() + "' to non-container";
        }
        listNode = db.resolve_(this.path_, true);
        db.applyChanges(this.dependants_);
        return;
    }

    throw "cannot add node '" + this.path_.toString() + "' to a leaf";

};
/**
 * converts a change an object that can be turned into json
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Add.prototype.serialize = function(keepOld, valSerializor, opt_compressor) {
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    return {type: recoil.db.ChangeSet.Change.Type.ADD, path: this.path_.serialize(valSerializor, compressor),
            deps: recoil.db.ChangeSet.Change.serializeList(this.dependants_, keepOld, valSerializor, compressor)};
};


/**
 * @constructor
 * @implements recoil.db.ChangeSet.Change
 * @param {!recoil.db.ChangeSet.Path} path
 */

recoil.db.ChangeSet.Delete = function(path) {
    this.path_ = path;
};
/**
 * returns the number of changes in this change
 * @return {!number}
 */
recoil.db.ChangeSet.Delete.prototype.changeCount = function() {
    return 1;
};
/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathChangeMap
 * @param {recoil.db.ChangeSet.Change} pAncestor
 * @param {!Array<!number>} maxPos
 */
recoil.db.ChangeSet.Delete.prototype.merge = function(pathChangeMap, pAncestor, maxPos) {

    // find all my decendants and remove them they are not relevant
    var relations = pathChangeMap.findRelations(this.path_, true, maxPos);
    for (var i = relations.length - 1; i >= 0; i--) {
        var relation = relations[i];
        if (relation instanceof recoil.db.ChangeSet.Move) {
            if (recoil.util.object.isEqual(this.path_, relation.to())) {

                // remove
                var moveInfo = pathChangeMap.removeChangeInfo(relation);
                // we have to place the set before the move
                new recoil.db.ChangeSet.Delete(relation.from())
                    .merge(pathChangeMap, pAncestor, moveInfo.pos);
                return;
            }
            else if (this.path_.isAncestor(relation.to(), false)) {
                pathChangeMap.removeChangeInfo(relation);
            }
            else {
                var newPath = relation.beforeMovePath(this.path());
                // we know longer paths are moved before shorter paths
                //
                moveInfo = pathChangeMap.findChangeInfo(relation);
                new recoil.db.ChangeSet.Delete(newPath)
                    .merge(pathChangeMap, pAncestor, moveInfo.pos);
                return;
            }
        }
        else {
            if (this.path_.isAncestor(relation.path(), false)) {
                pathChangeMap.removeChangeInfo(relation);
            }
            else if (relation instanceof recoil.db.ChangeSet.Add) {
                if (recoil.util.object.isEqual(this.path_, relation.path())) {
                    pathChangeMap.removeChangeInfo(relation);
                    return;
                }
                relation.addDependant(this);
                pathChangeMap.add(this.path_, this, relation, maxPos);
                return;
            }

        }
    }
    pathChangeMap.add(this.path_, this, null, maxPos);

};
/**
 * convert all paths to absolute values and returns a copy
 *
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Delete.prototype.absolute = function(schema) {
    return new recoil.db.ChangeSet.Delete(schema.absolute(this.path_));
};
/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Delete.prototype.path = function() {
    return this.path_;
};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathMap
 */
recoil.db.ChangeSet.Delete.prototype.sortDesendants = function(pathMap) {
};

/**
 * @param {!recoil.db.ChangeDb} db
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet.Delete.prototype.applyToDb = function(db, schema) {
    var listNode;
    if (this.path_.lastKeys().length > 0) {
        // this is a list node we are deleting from
        listNode = db.resolve_(this.path_.unsetKeys(), false);
        if (!listNode) {
            throw "delete node '" + this.path_.unsetKeys().toString() + "' does not exist";
        }
        if (!(listNode instanceof recoil.db.ChangeDbNode.List)) {
            throw "cannot delete node '" + this.path_.toString() + "' from non-list";
        }

        listNode.remove(this.path_.last());
        return;
    }
    else {
        listNode = db.resolve_(this.path_.parent(), false);

        if (!(listNode instanceof recoil.db.ChangeDbNode.Container)) {
            throw "cannot remove node '" + this.path_.toString() + "' to non-container";
        }
        listNode.remove(this.path_.last());
        return;
    }

    throw "cannot remove node '" + this.path_.toString() + "' from a leaf";

};
/**
 * converts a change an object that can be turned into json
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Delete.prototype.serialize = function(keepOld, valSerializor, opt_compressor) {
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    return {type: recoil.db.ChangeSet.Change.Type.DEL, path: this.path_.serialize(valSerializor, compressor)};
};

/**
 * @constructor
 * @implements {recoil.db.ChangeSet.Change}
 * @param {!recoil.db.ChangeSet.Path} oldPath
 * @param {!recoil.db.ChangeSet.Path} newPath
 */

recoil.db.ChangeSet.Move = function(oldPath, newPath) {
    this.oldPath_ = oldPath;
    this.newPath_ = newPath;
};

/**
 * returns the number of changes in this change
 * @return {!number}
 */
recoil.db.ChangeSet.Move.prototype.changeCount = function() {
    return 1;
};
/**
 * convert all paths to absolute values and returns a copy
 *
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Move.prototype.absolute = function(schema) {
    return new recoil.db.ChangeSet.Move(schema.absolute(this.oldPath_), schema.absolute(this.newPath_));
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Move.prototype.beforeMovePath = function(path) {
    var pathItems = path.items();
    var newPathItems = this.from().items().slice(0);
    if (newPathItems.length > pathItems.length) {
        throw 'path must be >= move path';
    }
    for (var j = newPathItems.length; j < pathItems.length; j++) {
        newPathItems.push(pathItems[j]);
    }
    return new recoil.db.ChangeSet.Path(newPathItems);
};

/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathChangeMap
 * @param {recoil.db.ChangeSet.Change} pAncestor
 * @param {!Array<!number>} maxPos
 */
recoil.db.ChangeSet.Move.prototype.merge = function(pathChangeMap, pAncestor, maxPos) {
    //TODO implement move

    // previous sets nothing to do they should be previous

    // previous adds just change the add path

    // previous deletes should be fine

    // previous moves
    // just add this object there is nothing that conflicts


    var moves = pathChangeMap.findExact(this.oldPath_, recoil.db.ChangeSet.Move);

    for (var i = moves.length - 1; i >= 0; i--) {
        var move = /** @type {recoil.db.ChangeSet.Move} */ (moves[i]);

        if (recoil.util.object.isEqual(move.to(), this.oldPath_)) {
            var info = pathChangeMap.removeChangeInfo(move);
            if (info) {
                move.newPath_ = this.newPath_;
                pathChangeMap.addMove(move, info.ancestor, maxPos, info.pos);
                return;
            }
        }
    }

    pathChangeMap.addMove(this, pAncestor, maxPos);
};

/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Move.prototype.path = function() {
    return this.oldPath_;
};
/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Move.prototype.to = function() {
    return this.newPath_;
};
/**
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Move.prototype.from = function() {
    return this.oldPath_;
};
/**
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathMap
 */
recoil.db.ChangeSet.Move.prototype.sortDesendants = function(pathMap) {
};

/**
 * @param {!recoil.db.ChangeDb} db
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet.Move.prototype.applyToDb = function(db, schema) {
    var listNode = db.resolve_(this.oldPath_.unsetKeys(), false);
    if (!listNode) {
        throw "move node '" + this.oldPath_.unsetKeys().toString() + "' does not exist";
    }
    if (!(listNode instanceof recoil.db.ChangeDbNode.List)) {
        throw "move node '" + this.oldPath_.unsetKeys().toString() + "' is not a list";
    }

    var oldNode = listNode.remove(this.oldPath_.last());
    if (!oldNode) {
        throw "move node '" + this.oldPath_.toString() + "' does not exist";
    }
    listNode.add(this.newPath_.last(), oldNode);
};
/**
 * converts a path to an object that can be turned into json
 * @param {!boolean} keepOld do we need the undo information
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Move.prototype.serialize = function(keepOld, valSerializor, opt_compressor) {
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    return {type: recoil.db.ChangeSet.Change.Type.MOVE, from: this.oldPath_.serialize(valSerializor, compressor),
            to: this.newPath_.serialize(valSerializor, compressor)};
};

/**
 * remove a path from the list
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!Array<!recoil.db.ChangeSet.Path>} list
 */
recoil.db.ChangeSet.removePath = function(path, list) {
    for (var i = 0; i < list.length; i++) {
        if (recoil.util.object.isEqual(list[i], path)) {
            list.splice(i, 1);
            return;
        }
    }
};
/**
 * @constructor
 */
recoil.db.ChangeSet.PathChangeMap = function() {
    this.root_ = new recoil.db.ChangeSet.PathChangeMapNode_();
    this.next_ = 0;
    this.values_ = [];
};
/**
 * @param {{pos:!Array<!number>}} x
 * @param {{pos:!Array<!number>}} y
 * @return {!number}
 */
recoil.db.ChangeSet.PathChangeMap.comparePos = function(x, y) {
    for (var i = 0; i < x.length && y.length; i++) {
        var res = x[i].pos - y[i].pos;
        if (res !== 0) {
            return res;
        }
    }
    // the longer length is smaller
    return y.length - x.length;
};
/**
 * @param {function({change:!recoil.db.ChangeSet.Change,pos:!Array<!number>,ancestor:recoil.db.ChangeSet.Change})} callback
 */
recoil.db.ChangeSet.PathChangeMap.prototype.forEach = function(callback) {
    this.root_.forEach(callback);
};

/**
 * @param {!recoil.db.ChangeSet.Change} change
 * @return {?{change:!recoil.db.ChangeSet.Change,pos:!Array<!number>,ancestor:recoil.db.ChangeSet.Change}}
 */
recoil.db.ChangeSet.PathChangeMap.prototype.findChangeInfo = function(change) {
    var cur = this.root_;
    var items = change.path().items();
    for (var i = 0; i < items.length && cur; i++) {
        var item = items[i];
        cur = cur.get(item);
    }

    if (cur) {
        var values = cur.values();
        for (i = 0; i < values.length; i++) {
            if (values[i].change === change) {
                return values[i];
            }
        }
    }
    return null;
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?=} opt_type
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.PathChangeMap.prototype.findExact = function(path, opt_type) {
    var items = path.items();

    var cur = this.root_;

    for (var i = 0; i < items.length && cur; i++) {
        var item = items[i];
        cur = cur.get(item);
    }
    var res = [];
    var toSort = [];
    if (cur) {
        cur.values().forEach(function(val) {
            if (opt_type === undefined || val.change instanceof opt_type) {
                toSort.push(val);
            }
        });
    }

    goog.array.sort(toSort, recoil.db.ChangeSet.PathChangeMap.comparePos);
    toSort.forEach(function(v) {
        res.push(v.change);
    });
    return res;

};

/**
 * @private
 * @param {!Array<!recoil.db.ChangeSet.PathItem>} items
 * @param {!number} index
 * @param {!recoil.db.ChangeSet.PathChangeMapNode_} node
 * @return {!boolean} if node was removed
 */
recoil.db.ChangeSet.PathChangeMap.prototype.removeIfEmptyNode_ = function(items, index, node) {
    if (index === items.length) {
        return node.children_.getCount() === 0 && node.values().length === 0;
    }

    var item = items[index];
    var cur = node.get(items[index]);

    if (!cur) {
        return false;
    }
    if (this.removeIfEmptyNode_(items, index + 1, cur)) {
        node.children_.remove({key: item});
        return node.values().length === 0 && node.children_.getCount() === 0;
    }
    return false;
};


/**
 * @param {!recoil.db.ChangeSet.Change} change
 * @return {?{change:!recoil.db.ChangeSet.Change,ancestor:recoil.db.ChangeSet.Change,pos:!Array<!number>}}
 */
recoil.db.ChangeSet.PathChangeMap.prototype.removeChangeInfo = function(change) {
    var me = this;
    var removeInternal = function(path) {
        var items = path.items();

        var cur = me.root_;

        for (var i = 0; i < items.length && cur; i++) {
            var item = items[i];
            cur = cur.get(item);
        }
        if (cur) {
            var idx = undefined;
            var removed = cur.removeChange(change);
            if (removed) {
                if (removed.ancestor) {
                    removed.ancestor.removeDependant(change);
                }

                me.removeIfEmptyNode_(items, 0, me.root_);
                return removed;
            }
        }
        return null;
    };

    if (change instanceof recoil.db.ChangeSet.Move) {
        removeInternal(change.to());
        return removeInternal(change.from());
    }

    if (change) {
        return removeInternal(change.path());
    }
    return null;

};

/**
 * all changes at path level and above
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?=} opt_type
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.PathChangeMap.prototype.findAncestors = function(path, opt_type) {
    var items = path.items();
    var cur = this.root_;
    var toSort = [];

    for (var i = 0; i < items.length && cur; i++) {
        var item = items[i];
        cur = cur.get(item);
        if (cur) {
            // nothing should be at root so that is ok
            cur.values().forEach(function(val) {
                if (opt_type === undefined || val.change instanceof opt_type) {
                    toSort.push({pos: val.pos, change: val.change});
                }
            });
        }
    }
    goog.array.sort(toSort, recoil.db.ChangeSet.PathChangeMap.comparePos);
    var res = [];
    toSort.forEach(function(v) {
        res.push(v.change);
    });

    return res;
};

/**
 * all changes at path level and above, and directly below
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!boolean} equal should we include equal
 * @param {?Array<!number>} max the maxiumn value to return
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.PathChangeMap.prototype.findRelations = function(path, equal, max) {
    var items = path.items();
    var cur = this.root_;
    var toSort = [];

    for (var i = 0; i < items.length && cur; i++) {
        cur.values().forEach(function(val) {
            if (max === undefined || max === null || max.length === 0
                || recoil.db.ChangeSet.PathChangeMap.comparePos({pos: max}, val) <= 0) {
                toSort.push({pos: val.pos, change: val.change});
            }
        });
        var item = items[i];
        cur = cur.get(item);
    }

    if (cur) {
        if (equal) {
            cur.forEach(function(val) {
                if (max === undefined || max === null || max.length === 0
                    || recoil.db.ChangeSet.PathChangeMap.comparePos({pos: max}, val) <= 0) {
                    toSort.push({pos: val.pos, change: val.change});
                }
            });
        }
        else {
            cur.forEachDecendants(function(val) {
                if (max === undefined || max === null || max.length === 0
                    || recoil.db.ChangeSet.PathChangeMap.comparePos({pos: max}, val) <= 0) {

                    toSort.push({pos: val.pos, change: val.change});
                }
            });
        }
    }
    goog.array.sort(toSort, recoil.db.ChangeSet.PathChangeMap.comparePos);
    var res = [];
    toSort.forEach(function(v) {
        res.push(v.change);
    });

    return res;
};

/**
 * @param {!recoil.db.ChangeSet.Move} change
 * @param {recoil.db.ChangeSet.Change} ancestor
 * @param {!Array<!number>} max
 * @param {!Array<!number>=} opt_pos
 */
recoil.db.ChangeSet.PathChangeMap.prototype.addMove = function(change, ancestor, max, opt_pos) {
    var toItems = change.to().items();
    var fromItems = change.from().items();
    var cur = this.root_;
    max = max.slice(0);


    if (opt_pos === undefined) {
        max.push(this.next_);
        this.next++;
    }
    else {
        max = opt_pos;
    }
    for (var i = 0; i < toItems.length; i++) {
        var item = toItems[i];
        cur = cur.create(item);
    }

    cur.values_.push({change: change, ancestor: ancestor, pos: max});
    cur = this.root_;
    for (i = 0; i < fromItems.length; i++) {
        item = fromItems[i];
        cur = cur.create(item);
    }
    cur.values_.push({change: change, ancestor: ancestor, pos: max, hide: true});

};
/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!recoil.db.ChangeSet.Change} change
 * @param {recoil.db.ChangeSet.Change} ancestor
 * @param {!Array<!number>} max
 * @param {number=} opt_pos
 */
recoil.db.ChangeSet.PathChangeMap.prototype.add = function(path, change, ancestor, max, opt_pos) {
    var items = path.items();
    var cur = this.root_;
    max = max.slice(0);
    var pos = opt_pos === undefined ? this.next_ : opt_pos;
    if (opt_pos === undefined) {
        this.next++;
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        cur = cur.create(item);
    }
    max.push(pos);
    cur.values_.push({change: change, ancestor: ancestor, pos: max});
};
/**
 * @constructor
 * @private
 */
recoil.db.ChangeSet.PathChangeMapNode_ = function() {
    this.children_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
    this.values_ = [];
};
/**
 * @param {!recoil.db.ChangeSet.Change} change
 * @return {?{change:!recoil.db.ChangeSet.Change,ancestor:recoil.db.ChangeSet.Change,pos:!Array<!number>}}
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.removeChange = function(change) {
    for (var i = 0; i < this.values_.length; i++) {
        if (this.values_[i].change === change) {
            return this.values_.splice(i, 1)[0];
        }
    }
    return null;
};

/**
 * @param {function({change:!recoil.db.ChangeSet.Change,pos:!Array<!number>,ancestor:recoil.db.ChangeSet.Change})} callback
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.forEach = function(callback) {
    this.values_.forEach(callback);
    this.children_.inOrderTraverse(function(node) {
        node.value.forEach(callback);
    });

};

/**
 * @param {function({change:!recoil.db.ChangeSet.Change,pos:!Array<!number>,ancestor:recoil.db.ChangeSet.Change})} callback
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.forEachDecendants = function(callback) {
    this.children_.inOrderTraverse(function(node) {
        node.value.forEach(callback);
    });

};

/**
 * @return {!Array<!{change:!recoil.db.ChangeSet.Change,ancestor:recoil.db.ChangeSet.Change,pos:!Array<!number>}>}
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.values = function() {
    return this.values_;
};
/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 * @return {recoil.db.ChangeSet.PathChangeMapNode_}
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.get = function(item) {
    var node = this.children_.findFirst({key: item});
    if (node) {
        return node.value;
    }
    return null;
};

/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 * @return {!recoil.db.ChangeSet.PathChangeMapNode_}
 */
recoil.db.ChangeSet.PathChangeMapNode_.prototype.create = function(item) {
    return this.children_.safeFind({key: item, value: new recoil.db.ChangeSet.PathChangeMapNode_()}).value;
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!Array<!recoil.db.ChangeSet.Path>} list
 * @return {recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.findPath = function(path, list) {
    for (var i = 0; i < list.length; i++) {
        if (recoil.util.object.isEqual(list[i], path)) {
            return list[i];
        }
    }
    return null;
};

/**
 * returns the number of changes in this change
 * @return {!number}
 */
recoil.db.ChangeSet.Set.prototype.changeCount = function() {
    return 1;
};

/**
 * if the change is a set
 * if exists move change with our to path, make path the move from path and repeat
 * if add , add us as dependant of the add
 * if delete exist invalid anyway
 *
 * @param {!recoil.db.ChangeSet.PathChangeMap} pathChangeMap
 * @param {recoil.db.ChangeSet.Change} pAncestor
 * @param {!Array<!number>} maxPos
 */
recoil.db.ChangeSet.Set.prototype.merge = function(pathChangeMap, pAncestor, maxPos) {
    var sets = pathChangeMap.findExact(this.path_, recoil.db.ChangeSet.Set);
    // if exists set change update to and stop
    if (sets.length > 0) {
        if (sets.length > 1) {
            throw 'mutiple set on same key not merged correctly';
        }
        // should only be 1
        sets[0].newVal_ = this.newVal_;
    }
    else {
        // if exists move change with our to path, make path the move from path and repeat
        var moves = pathChangeMap.findAncestors(this.path_);
        var ancestor = null;

        for (var j = 0; j < moves.length; j++) {
            var move = moves[j];
            if (move instanceof recoil.db.ChangeSet.Move) {
                if (move.to().isAncestor(this.path_, true)) {
                    ancestor = move;
                    break;
                }
            }
            if (move instanceof recoil.db.ChangeSet.Delete) {
                return;
            }
        }

        if (ancestor) {

            var newPath = ancestor.beforeMovePath(this.path());
            // we know longer paths are moved before shorter paths
            //
            var moveInfo = pathChangeMap.findChangeInfo(ancestor);


            // we have to place the set before the move
            new recoil.db.ChangeSet.Set(newPath, this.oldVal_, this.newVal_)
                .merge(pathChangeMap, pAncestor, moveInfo.pos);
            return;
        }


        var len = 0;
        for (j = 0; j < moves.length; j++) {
            var add = moves[j];
            if (add instanceof recoil.db.ChangeSet.Add) {
                if (add.path().parts().length > len) {
                    ancestor = add;
                }
            }
        }

        // if add , add us as dependant of the add
        if (ancestor) {
            ancestor.addDependant(this);
            pathChangeMap.add(this.path_, this, ancestor, maxPos, undefined);
            return;
        }
        // just a set nothing to change
        pathChangeMap.add(this.path_, this, pAncestor, maxPos);
    }

};

/**
 * takes a list of changes and converts it into a set of minimal changes
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!Array<!recoil.db.ChangeSet.Change>} changes
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.merge = function(schema, changes) {
    var pathChangeMap = new recoil.db.ChangeSet.PathChangeMap();

    for (var i = 0; i < changes.length; i++) {
        var change = changes[i].absolute(schema);

        change.merge(pathChangeMap, null, []);




        // if the change is add just add

        // if the change is a delete
        // remove all changes sub changes
        // if was and add of this key then do not add us
        // if move to us change path to original

        // if move
        // if was added move all actions us and change path to dest
        // do not add
    }
    var toSort = [];
    pathChangeMap.forEach(function(change) {
        if (!change.ancestor && !change.hide) {
            change.change.sortDesendants(pathChangeMap);
            toSort.push(change);
        }
    });
    goog.array.sort(toSort, recoil.db.ChangeSet.PathChangeMap.comparePos);
    var res = [];
    toSort.forEach(function(v) {
        res.push(v.change);
    });
    return res;
};
/**
 * caculates a list of changes between an old an new objec
 *
 * it should be noted the origColumn is used to determine the original key if it is a keyed list
 *
 * @param {?} oldObj the old object
 * @param {?} newObj the new obj
 * @param {!recoil.db.ChangeSet.Path} path the path to the object
 * @param {!string} origColumn the column key describing the original keys column
 * @param {!recoil.db.ChangeSet.Schema} schema an interface describing all the
 *                                      object in the schema
 * @param {{changes:!Array<recoil.db.ChangeSet.Change>, errors:!Array<recoil.db.ChangeSet.Error>}=} opt_changes
 * @return {!{changes:!Array<recoil.db.ChangeSet.Change>, errors:!Array<recoil.db.ChangeSet.Error>}}
 */
recoil.db.ChangeSet.diff = function(oldObj, newObj, path, origColumn, schema, opt_changes) {
    var changes = opt_changes === undefined ? {changes: [], errors: []} : opt_changes;

    if (schema.isLeaf(path)) {
        if (!recoil.util.object.isEqual(oldObj, newObj)) {
            changes.changes.push(new recoil.db.ChangeSet.Set(schema.absolute(path), oldObj, newObj));
        }
        return changes;
    }

    if ((oldObj === null || oldObj === undefined) && (newObj == null || newObj === undefined)) {
        return changes;
    }

    if (newObj === null || newObj === undefined) {
        changes.changes.push(new recoil.db.ChangeSet.Delete(schema.absolute(path)));
        return changes;
    }
    var subChanges = changes;
    if (oldObj === null || oldObj === undefined) {
        subChanges = {changes: [], errors: changes.errors};
        changes.changes.push(new recoil.db.ChangeSet.Add(schema.absolute(path), subChanges.changes));
    }
    else if (schema.isKeyedList(path)) {
        var needed = [];
        var used = [];
        var origKeyToNew = new goog.structs.AvlTree(recoil.util.object.compareKey);

        for (var i = 0; i < newObj.length; i++) {
            var origKey = newObj[i][origColumn];
            if (origKey) {
                origKeyToNew.add({key: path.setKeys(schema.keys(path), origKey), row: newObj[i]});
            }
        }

        // do any deletes first they are not going to conflict with any existing keys
        for (i = 0; i < oldObj.length; i++) {
            var oldChild = oldObj[i];
            var oldKey = schema.createKeyPath(path, oldChild);
            var newChildEntry = origKeyToNew.findFirst({key: oldKey});
            if (newChildEntry) {
                var newKey = schema.createKeyPath(path, newChildEntry.row);
                used.push(oldKey);
                if (!recoil.util.object.isEqual(newKey, oldKey)) {
                    needed.push({idx: i, key: newKey, removeKey: oldKey});
                }
                else {
                    recoil.db.ChangeSet.diff(oldChild, newChildEntry.row, newKey, origColumn, schema, changes);
                }
            }
            else {
                changes.changes.push(new recoil.db.ChangeSet.Delete(schema.absolute(oldKey)));
            }
        }
        for (i = 0; i < newObj.length; i++) {
            var newChild = newObj[i];
            if (!newChild[origColumn]) {
                newKey = schema.createKeyPath(path, newChild);
                needed.push({idx: i, key: newKey});
            }
        }


        while (needed.length > 0) {
            var newNeeded = [];
            needed.forEach(function(info) {
                if (recoil.db.ChangeSet.findPath(info.key, used)) {
                    newNeeded.push(info);
                }
                else {
                    var deps = {changes: [], errors: changes.errors};
                    if (info.removeKey) {
                        recoil.db.ChangeSet.diff(oldObj[info.idx], newObj[info.idx], info.removeKey, origColumn, schema,
                                                 changes);
                        changes.changes.push(new recoil.db.ChangeSet.Move(schema.absolute(info.removeKey), schema.absolute(info.key)));
                        recoil.db.ChangeSet.removePath(info.removeKey, used);
                    }
                    else {
                        recoil.db.ChangeSet.diff(null, newObj[info.idx], info.key, origColumn, schema, changes);
                    }
                    used.push(info.key);
                }
            });
            if (needed.length === newNeeded.length) {
                // for now just leave we may deal with these at a higher level

                // first build up a map of dup needed or in used if they are in there then they are real duplicate
                // add to errors
                // the rest are just loops pick one and do a delete
                needed.forEach(function(info) {
                });
                needed.forEach(function(info) {
                    changes.errors.push(new recoil.db.ChangeSet.DupPk(schema.absolute(info.key)));
                });
                break;
            }
            needed = newNeeded;
        }
        return changes;

    }

    schema.children(path).forEach(
        function(child) {
            var keys = schema.keys(path);
            if (keys.indexOf(child) !== -1) {
                return;
            }
            var myChildren = schema.children(path.appendName(child));
            var oldV = oldObj ? oldObj[child] : null;
            var newV = newObj ? newObj[child] : null;
            recoil.db.ChangeSet.diff(oldV, newV, path.appendName(child), origColumn, schema, subChanges);
        });
    return changes;

};


/**
 * @interface
 */
recoil.db.ChangeDbNode = function() {};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {?}
 */
recoil.db.ChangeDbNode.prototype.get = function(schema, path) {};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.PathItem} item the item to create or get
 * @param {recoil.db.ChangeSet.Path} path if not null then specifies what type to create
 *                                        otherwize creates container
 * @param {!boolean} create create if not present
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.prototype.getChildNode = function(schema, item, path, create) {};


/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 */
recoil.db.ChangeDbNode.prototype.set = function(schema, path, val) {};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {!recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.create = function(schema, path) {
    if (schema.isKeyedList(path)) {
        return new recoil.db.ChangeDbNode.List();
    }
    if (schema.isLeaf(path)) {
        return new recoil.db.ChangeDbNode.Leaf();
    }
    return new recoil.db.ChangeDbNode.Container();

};
/**
 * @implements {recoil.db.ChangeDbNode}
 * @constructor
 */
recoil.db.ChangeDbNode.Leaf = function() {
    this.value_ = undefined;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 */
recoil.db.ChangeDbNode.Leaf.prototype.set = function(schema, path, val) {
    this.value_ = val;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {?}
 */
recoil.db.ChangeDbNode.Leaf.prototype.get = function(schema, path) {
    return this.value_;
};

/**
 * @param {?} val
 */
recoil.db.ChangeDbNode.Leaf.prototype.setValue = function(val) {
    this.value_ = val;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.PathItem} item the item to create or get
 * @param {recoil.db.ChangeSet.Path} path if not null then specifies what type to create
 *                                        otherwize creates container
 * @param {!boolean} create create if not present
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.Leaf.prototype.getChildNode = function(schema, item, path, create) {
    throw 'unsupported operation, leaves have no children';
};

/**
 * @implements {recoil.db.ChangeDbNode}
 * @constructor
 */
recoil.db.ChangeDbNode.Container = function() {
    /**
     * @type {Object<!string,recoil.db.ChangeDbNode>}
     * @private
     **/
    this.children_ = {};
    this.useVal_ = false;
    this.val_ = null;
};

/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 */
recoil.db.ChangeDbNode.Container.prototype.setKeys = function(item) {
    // update the keys in the node
    var keys = item.keys();
    var names = item.keyNames();
    var children = this.children_;

    for (var i = 0; i < names.length; i++) {
        var child = names[i];
        var val = keys[i];
        if (!children[child]) {
            children[child] = new recoil.db.ChangeDbNode.Leaf();
        }
        children[child].setValue(val);
    }
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 */
recoil.db.ChangeDbNode.Container.prototype.set = function(schema, path, val) {
    var children = this.children_;
    if (val) {
        this.useVal_ = false;
        schema.children(path).forEach(function(child) {
            if (val.hasOwnProperty(child)) {
                var subPath = path.appendName(child);
                if (!children[child]) {
                    children[child] = recoil.db.ChangeDbNode.create(schema, subPath);
                }
                children[child].set(schema, subPath, val[child]);
            }
            else {
                delete children[child];
            }
        });
    } else {
        this.useVal_ = true;
        this.val_ = val;
    }
};


/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 */
recoil.db.ChangeDbNode.Container.prototype.remove = function(item) {
    delete this.children_[item.name()];
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {?}
 */
recoil.db.ChangeDbNode.Container.prototype.get = function(schema, path) {
    var res = {};
    if (this.useVal_) {
        return this.val_;
    }
    var children = this.children_;
    schema.children(path).forEach(function(child) {
        if (children.hasOwnProperty(child)) {
            res[child] = children[child].get(schema, path.appendName(child));
        }
    });
    return res;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.PathItem} item the item to create or get
 * @param {recoil.db.ChangeSet.Path} path if not null then specifies what type to create
 *                                        otherwize creates container
 * @param {!boolean} create create if not present
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.Container.prototype.getChildNode = function(schema, item, path, create) {
    var res = this.children_[item.name()];
    if (res) {
        return res;
    }
    if (!create) {
        return null;
    }
    if (path) {
        res = recoil.db.ChangeDbNode.create(schema, path);
    }
    else {
        res = new recoil.db.ChangeDbNode.Container();
    }
    this.children_[item.name()] = res;
    return res;
};

/**
 * @implements {recoil.db.ChangeDbNode}
 * @constructor
 */
recoil.db.ChangeDbNode.List = function() {
    /**
     * @type {goog.structs.AvlTree<{key:Array,value:recoil.db.ChangeDbNode}>}
     * @private
     **/
    this.keys_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} val
 */
recoil.db.ChangeDbNode.List.prototype.set = function(schema, path, val) {
    var keys = this.keys_;
    // we could schemas that filter nodes but not yet
    var newKeys = new goog.structs.AvlTree(recoil.util.object.compareKey);

    val.forEach(function(val) {
        var subKey = schema.createKeyPath(path, val);
        var newNode = keys.safeFind({key: subKey.lastKeys(), value: new recoil.db.ChangeDbNode.Container()});
        newNode.value.set(schema, subKey, val);
        newKeys.add(newNode);
    });
    this.keys_ = newKeys;
};

/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.List.prototype.remove = function(item) {
    var node = this.keys_.remove({key: item.keys(), value: null});
    if (node) {
        return node.value;
    }
    return null;
};

/**
 * @param {!recoil.db.ChangeSet.PathItem} item
 * @param {!recoil.db.ChangeDbNode} node
 */
recoil.db.ChangeDbNode.List.prototype.add = function(item, node) {
    node.setKeys(item);
    this.keys_.add({key: item.keys(), value: node});
};


/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {?}
 */
recoil.db.ChangeDbNode.List.prototype.get = function(schema, path) {
    var res = [];
    this.keys_.inOrderTraverse(function(val) {
        var subKey = schema.createKeyPath(path, val.value);
        res.push(val.value.get(schema, subKey));
    });
    return res;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema
 * @param {!recoil.db.ChangeSet.PathItem} item the item to create or get
 * @param {recoil.db.ChangeSet.Path} path if not null then specifies what type to create
 *                                        otherwize creates container
 * @param {!boolean} create create if not present
 * @return {recoil.db.ChangeDbNode}
 */
recoil.db.ChangeDbNode.List.prototype.getChildNode = function(schema, item, path, create) {
    var lookup = {key: item.keys(), value: new recoil.db.ChangeDbNode.Container()};
    var entry = create ?
        this.keys_.safeFind(lookup) : this.keys_.findFirst(lookup);
    if (entry) {
        return entry.value;
    }
    return null;

};

/**
 * a map that given a path finds all items subitems
 * @template T
 * @private
 * @constructor
 */
recoil.db.PathMapNode_ = function() {
    this.values_ = [];
    this.children_ = new goog.structs.AvlTree(recoil.util.object.compareKey);
};

/**
 * @param {!Array<!recoil.db.ChangeSet.PathItem>} items
 * @param {!number} pos
 * @param {!boolean} create should we create nodes if they don't exist
 * @return {recoil.db.PathMapNode_} the node containing the data
 */
recoil.db.PathMapNode_.prototype.resolve = function(items, pos, create) {
    if (pos === items.length) {
        return this;
    }
    var key = {key: items[pos], node: new recoil.db.PathMapNode_()};
    var child = create ? this.children_.safeFind(key) : this.children_.findFirst(key);
    if (child) {
        return child.node.resolve(items, pos + 1, create);
    }
    return null;
};

/**
 * @param {!recoil.db.ChangeSet.Schema} schema used to filter not in our object
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!Array<T>} res
 */
recoil.db.PathMapNode_.prototype.getAll = function(schema, path, res) {
    if (schema.exists(path)) {
        this.values_.forEach(function(v) {
            res.push(v);
        });
        this.children_.inOrderTraverse(function(node) {
            node.node.getAll(schema, path.append(node.key), res);
        });
    }
};

/**
 * @param {!Array<!recoil.db.ChangeSet.PathItem>} items
 * @param {!number} pos
 * @return {!boolean} delete this node;
 */
recoil.db.PathMapNode_.prototype.removeRec = function(items, pos) {
    if (pos === items.length) {
        this.values_ = [];
        return this.children_.getCount() === 0;
    }
    var key = {key: items[pos], node: undefined};
    var sub = this.children_.findFirst(key);

    if (sub && sub.node.removeRec(items, pos + 1)) {
        this.children_.remove(key);
        return this.children_.getCount() === 0;
    }
    return false;
};
/**
 * a map that given a path finds all items subitems
 * @template T
 * @constructor
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.PathMap = function(schema) {
    /**
     * @type {!recoil.db.PathMapNode_<T>}
     * @private
     */
    this.root_ = new recoil.db.PathMapNode_();
    this.schema_ = schema;
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {T} value
 */
recoil.db.PathMap.prototype.put = function(path, value) {
    var node = this.root_.resolve(this.schema_.absolute(path).items(), 0, true);
    node.values_ = [value];
};


/**
 * @param {!recoil.db.ChangeSet.Path} path
 */
recoil.db.PathMap.prototype.remove = function(path) {
    this.root_.removeRec(this.schema_.absolute(path).items(), 0);
};

/**
 * @param {!recoil.db.ChangeSet.Path} path
 * @return {!Array<T>}
 */
recoil.db.PathMap.prototype.get = function(path) {
    var node = this.root_.resolve(this.schema_.absolute(path).items(), 0, false);
    var res = [];
    if (node) {
        node.getAll(this.schema_, path, res);
    }
    return res;
};


