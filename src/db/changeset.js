goog.provide('recoil.db.ChangeSet');
goog.provide('recoil.db.ChangeSet.Add');
goog.provide('recoil.db.ChangeSet.Change');
goog.provide('recoil.db.ChangeSet.Delete');
goog.provide('recoil.db.ChangeSet.Move');
goog.provide('recoil.db.ChangeSet.Path');
goog.provide('recoil.db.ChangeSet.Set');

goog.require('recoil.util.object');

/**
 * @constructor
 */
recoil.db.ChangeSet = function() {
};


/**
 * @interface
 */
recoil.db.ChangeSet.Change = function() {
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
 * @return {!Array<!string>} keys
 */
recoil.db.ChangeSet.Schema.prototype.keys = function(path) {

};

/**
 * @param {recoil.db.ChangeSet.Path} path
 */
recoil.db.ChangeSet.Schema.prototype.isLeaf = function(path) {

};

/**
 * @param {recoil.db.ChangeSet.Path} path
 */
recoil.db.ChangeSet.Schema.prototype.isKeyedList = function(path) {

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
        this.path_ = path.split('/').slice(1);
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
 * @return {!string}
 */
recoil.db.ChangeSet.Path.prototype.toString = function() {
    return '/' + this.path_.join('/') + ':' + this.params_;
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
    return this.params_;
};


/**
 * @return {!Array<!string>}
 */
recoil.db.ChangeSet.Path.prototype.parts = function() {
    return this.path_;
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
 * @constructor
 * @implements recoil.db.ChangeSet.Change
 * @param {!recoil.db.ChangeSet.Path} path
 */

recoil.db.ChangeSet.Delete = function(path) {
    this.path_ = path;
};

/**
 * @constructor
 * @implements {recoil.db.ChangeSet.Change}
 * @param {!recoil.db.ChangeSet.Path} oldPath
 * @param {!recoil.db.ChangeSet.Path} newPath
 * @param {!Array<recoil.db.ChangeSet.Change>} depends
 */

recoil.db.ChangeSet.Move = function(oldPath, newPath, depends) {
    this.oldPath_ = oldPath;
    this.newPath_ = newPath;
    this.depends_ = depends;
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
 * it should be noted that when the object is a keyed list the key changes are determined by the index into the list
 *
 * @param {?} oldObj the old object
 * @param {?} newObj the new obj
 * @param {!recoil.db.ChangeSet.Path} path the path to the object
 * @param {!recoil.db.ChangeSet.Schema} schema an interface describing all the
 *                                      object in the schema
 * @param {{changes:!Array<recoil.db.ChangeSet.Change>, errors:!Array<recoil.db.ChangeSet.Error>}=} opt_changes
 * @return {!{changes:!Array<recoil.db.ChangeSet.Change>, errors:!Array<recoil.db.ChangeSet.Error>}}
 */
recoil.db.ChangeSet.diff = function(oldObj, newObj, path, schema, opt_changes) {
    var changes = opt_changes === undefined ? {changes: [], errors: []} : opt_changes;

    if (schema.isLeaf(path)) {
        if (!recoil.util.object.isEqual(oldObj, newObj)) {
            changes.changes.push(new recoil.db.ChangeSet.Set(path, oldObj, newObj));
        }
        return changes;
    }

    if ((oldObj === null || oldObj === undefined) && (newObj == null || newObj === undefined)) {
        return changes;
    }

    if (newObj === null || newObj === undefined) {
        changes.changes.push(new recoil.db.ChangeSet.Delete(path));
        return changes;
    }
    var subChanges = changes;
    if (oldObj === null || oldObj === undefined) {
        subChanges = {changes: [], errors: changes.errors};
        changes.changes.push(new recoil.db.ChangeSet.Add(path, subChanges.changes));
    }
    else if (schema.isKeyedList(path)) {
        var needed = [];
        var used = [];

        // do any deletes first they are not going to conflict with any existing keys
        for (var i = 0; i < oldObj.length || i < newObj.length; i++) {
            var oldChild = oldObj.length > i ? oldObj[i] : null;
            var newChild = newObj.length > i ? newObj[i] : null;
            var oldKey = schema.createKeyPath(path, oldChild);
            var newKey = schema.createKeyPath(path, newChild);

            if (newChild === null && oldChild !== null) {
                changes.changes.push(new recoil.db.ChangeSet.Delete(oldKey));
            }
            else if (oldChild !== null && newChild !== null) {
                used.push(oldKey);
                if (!recoil.util.object.isEqual(newKey, oldKey)) {
                    needed.push({idx: i, key: newKey, removeKey: oldKey});
                }
            }
            else if (oldChild === null && newChild !== null) {
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
                        recoil.db.ChangeSet.diff(oldObj[info.idx], newObj[info.idx], info.key, schema,
                                                 deps);
                        changes.changes.push(new recoil.db.ChangeSet.Move(info.removeKey, info.key, deps.changes));
                        recoil.db.ChangeSet.removePath(info.removeKey, used);
                    }
                    else {
                        recoil.db.ChangeSet.diff(null, newObj[info.idx], info.key, schema, changes);
                    }
                    used.push(info.key);
                }
            });
            if (needed.length === newNeeded.length) {
                needed.forEach(function(info) {
                    changes.errors.push(new recoil.db.ChangeSet.DupPk(info.key));
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
            recoil.db.ChangeSet.diff(oldV, newV, path.append(child), schema, subChanges);
        });
    return changes;

};
