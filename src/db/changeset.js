goog.provide('recoil.db.ChangeSet');
goog.provide('recoil.db.ChangeSet.Add');
goog.provide('recoil.db.ChangeSet.Change');
goog.provide('recoil.db.ChangeSet.Delete');
goog.provide('recoil.db.ChangeSet.Move');
goog.provide('recoil.db.ChangeSet.Path');
goog.provide('recoil.db.ChangeSet.Set');

goog.require('goog.structs.AvlTree');
goog.require('recoil.util.object');

/**
 * @constructor
 * @param {!recoil.db.ChangeSet.Schema} schema
 */
recoil.db.ChangeSet = function(schema) {
    this.schema_ = schema;
    this.orig_ = {};
};

/**
 * @param {!recoil.db.ChangeSet.Path} rootPath
 * @param {!Object} object
 */
recoil.db.ChangeSet.prototype.set = function(rootPath, object) {
    var parts = rootPath.parts();
    var keys = rootPath.keys();
    var curPath = new recoil.db.ChangeSet.Path([], []);
    var cur = this.orig_;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        if (!cur.children) {
            cur.children = {};
        }
        if (cur.children[part] === undefined) {
            cur.children[part] = {};
        }
        var c = cur.children[part];

        curPath = curPath.append(part);
        var curKeys = this.schema_.keys(curPath);

        if (curKeys.length > 0 && (keys.length > 0 || i + 1 < parts.length)) {
            // we are using up the keys
            if (curKeys.length > keys.length) {
                throw 'not enough keys';
            }

            var thisKey = keys.slice(0, curKeys.length);
            keys.splice(0, curKeys.length);

            // create a map of keys if it does not exist

            if (!c.keys) {
                c.keys = new goog.structs.AvlTree(recoil.util.object.compareKey);
            }

            cur = c.keys.find({key: thisKey});

            if (!cur) {
                cur = {key: thisKey};
                c.keys.add(cur);
            }

        }
        else {
            cur = c;
        }

    }

    cur.value = object;
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
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {!Array<?>} val
 * @return {?}
 */
recoil.db.ChangeSet.ValueSerializor.prototype.serializeKeys = function(path, val) {
};
/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.Path} path
 * @param {?} serialized
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.ValueSerializor.prototype.deserializeKeys = function(path, serialized) {
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
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor=} opt_compressor
 * @return {!recoil.db.ChangeSet.Change}
 */
recoil.db.ChangeSet.Change.deserialize = function(object, valSerializor, opt_compressor) {
    var ChangeType = recoil.db.ChangeSet.Change.Type;
    var compressor = opt_compressor || new recoil.db.ChangeSet.DefaultPathCompressor();
    if (object.type === ChangeType.MOVE && object.deps !== undefined) {
        return new recoil.db.ChangeSet.Move(
            recoil.db.ChangeSet.Path.deserialize(object.from, valSerializor, compressor),
            recoil.db.ChangeSet.Path.deserialize(object.to, valSerializor, compressor),
            recoil.db.ChangeSet.Change.deserializeList(object.deps, valSerializor, compressor));
    }
    if (object.type === ChangeType.DEL) {
        return new recoil.db.ChangeSet.Delete(
            recoil.db.ChangeSet.Path.deserialize(object.path, valSerializor, compressor));
    }
    if (object.type === ChangeType.ADD && object.deps) {
        return new recoil.db.ChangeSet.Add(
            recoil.db.ChangeSet.Path.deserialize(object.path, valSerializor, compressor),
            recoil.db.ChangeSet.Change.deserializeList(object.deps, valSerializor, compressor));
    }

    if (object.type === ChangeType.SET) {
        var path = recoil.db.ChangeSet.Path.deserialize(object.path, valSerializor, compressor);
        return new recoil.db.ChangeSet.Set(
            path,
            valSerializor.deserialize(path, object.old), valSerializor.deserialize(path, object.new));

    }


    throw 'unrecogined change type';
};

/**
 * converts a path to an object that can be turned into json
 * @param {!Array<!Object>} object
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!Array<!recoil.db.ChangeSet.Change>}
 */
recoil.db.ChangeSet.Change.deserializeList = function(object, valSerializor, compressor) {
    var res = [];
    for (var i = 0; i < object.length; i++) {
        res.push(recoil.db.ChangeSet.Change.deserialize(object[i], valSerializor, compressor));
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
 * @constructor
 * @param {!string|!Array<!string>} path
 * @param {!Array<?>=} opt_params
 */
recoil.db.ChangeSet.Path = function(path, opt_params) {
    if (typeof(path) === 'string') {
        this.path_ = path.split('/');
        if (this.path_.length > 0 && this.path_[0] === '') {
            this.path_.shift();
        }
    }
    else {
        this.path_ = path;
    }
    this.params_ = opt_params || [];
};
/**
 * @param {!string|!Array<!string>} part
 * @param {!Array<?>=} opt_params
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.append = function(part, opt_params) {
    return new recoil.db.ChangeSet.Path(
        this.path_.concat(part), this.params_.concat(opt_params || []));
};

/**
 * @param {!string|!Array<!string>} part
 * @param {!Array<?>=} opt_params
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.prepend = function(part, opt_params) {
    part = typeof(part) === 'string' ? [part] : part;
    return new recoil.db.ChangeSet.Path(
        part.concat(this.path_), (opt_params || []).concat(this.params_));
};

/**
 * @param {!number} parts
 * @param {!number} params
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.removeFront = function(parts, params) {
    return new recoil.db.ChangeSet.Path(
        this.path_.slice(parts), this.params_.slice(params));
};

/**
 * converts a path to an object that can be turned into json
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!Object}
 */
recoil.db.ChangeSet.Path.prototype.serialize = function(valSerializor, compressor) {
    return {parts: compressor.compress(this.path_), params: valSerializor.serializeKeys(this, this.params_)};
};


/**
 * converts a path to an object that can be turned into json
 * @param {!Object} obj
 * @param {!recoil.db.ChangeSet.ValueSerializor} valSerializor
 * @param {!recoil.db.ChangeSet.PathCompressor} compressor
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.deserialize = function(obj, valSerializor, compressor) {
    var parts = compressor.decompress(obj.parts);
    var path = new recoil.db.ChangeSet.Path(parts);
    return new recoil.db.ChangeSet.Path(parts, valSerializor.deserializeKeys(path, obj.params));
};




/**
 * @return {!string}
 */
recoil.db.ChangeSet.Path.prototype.toString = function() {
    return '/' + this.path_.join('/') + ':' + this.params_;
};

/**
 * @return {!string}
 */
recoil.db.ChangeSet.Path.prototype.pathAsString = function() {
    return '/' + this.path_.join('/');
};


/**
 * @param {!Array<?>} params
 * @return {!recoil.db.ChangeSet.Path}
 */
recoil.db.ChangeSet.Path.prototype.addKeys = function(params) {
    return this.append([], params);
};


/**
 * @return {!Array<?>}
 */
recoil.db.ChangeSet.Path.prototype.keys = function() {
    return this.params_.slice(0);
};


/**
 * @return {!Array<!string>}
 */
recoil.db.ChangeSet.Path.prototype.parts = function() {
    return this.path_.slice(0);
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
 * @param {!Array<!recoil.db.ChangeSet.Change>} depends
 */

recoil.db.ChangeSet.Move = function(oldPath, newPath, depends) {
    this.oldPath_ = oldPath;
    this.newPath_ = newPath;
    this.depends_ = depends;
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
            to: this.newPath_.serialize(valSerializor, compressor),
            deps: recoil.db.ChangeSet.Change.serializeList(this.depends_, keepOld, valSerializor, compressor)};
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
                origKeyToNew.add({key: path.append([], origKey), row: newObj[i]});
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
                                                 deps);
                        changes.changes.push(new recoil.db.ChangeSet.Move(schema.absolute(info.removeKey), schema.absolute(info.key), deps.changes));
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
            var myChildren = schema.children(path.append(child));
            var oldV = oldObj ? oldObj[child] : null;
            var newV = newObj ? newObj[child] : null;
            recoil.db.ChangeSet.diff(oldV, newV, path.append(child), origColumn, schema, subChanges);
        });
    return changes;

};
