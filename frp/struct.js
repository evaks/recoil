goog.provide('recoil.frp.struct');

goog.require('goog.object');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Frp');

/**
 * @param {string} name the attribute name of the element to get out of the struct
 * @template T
 * @param {recoil.frp.Behaviour} value the structure to get it out of
 * @param {T=} opt_default
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.struct.get = function(name, value, opt_default) {
    return value.frp().liftBI(function() {
        var res = value.get()[name];
        if (res === undefined) {
            res = opt_default;
        }
        return res;

    }, function(newVal) {
        var res = goog.object.clone(value.get());
        res[name] = newVal;
        value.set(res);
    }, value);
};

/**
 * @desc takes a structure and adds all overrides all the fields with extenstions
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {Object| recoil.frp.Behaviour<Object>} structB
 * @param {...(Object| recoil.frp.Behaviour<Object>)} var_extensionsB
 */
recoil.frp.struct.extend = function (frp, structB, var_extensionsB) {
    var args = [];
    var util = new recoil.frp.Util(frp);
    
    args.push(function() {
        var res = {};
        recoil.ui.object.addProps(arguments);
        return res;
    });

    args.push(function(val) {
        for (var key in val) {
            var done = false;
            for (var i = arguments.length; i >= 1 && !done; i--) {
                var arg = arguments[i][key];
                if (arg instanceof recoil.frp.Behaviour) {
                    arg.set(val[key]);
                    done = true;
                    break;
                }
            }
        }
    });
    for (var i = 1; i < arguments.length; i++) {
        args.push(recoil.frp.struct.flattern(frp, arguments[i]));
    }

    return frp.liftBI.apply(frp, args);
    
};

recoil.frp.struct.getBehavioursRec_ = function (struct, path, res) {
    if (path.indexOf(struct) !== -1) {
        return; // loop detected;
    }
    var newPath = goog.array.clone(path);
    newPath.push(struct);


    if (struct instanceof recoil.frp.Behaviour) {
        res.push(struct);
        return;
    }
    if (struct instanceof Array) {
        for (var i = 0; i < struct.length; i++) {
            res.push(recoil.frp.struct.getBehavioursRec_(struct[i],newPath, res));
        }
    }
    else if (struct instanceof Object) {
        for (var prop in struct) {
            if (struct.hasOwnProperty(prop)) {
                res.push(recoil.frp.struct.getBehavioursRec_(struct[prop],newPath, res));
            }
        }
    }
};

recoil.frp.struct.getBehaviours = function (struct) {
    var res = [];
    recoil.frp.struct.getBehavioursRec_(struct,[], res);
    return res;
};


recoil.frp.struct.setFlatternRec_ = function(struct, newVal, path) {
    if (newVal === undefined) {
        return;
    }
    if (path.indexOf(struct) !== -1) {
        return;
    }
    var newPath = goog.array.clone(path);
    newPath.push(struct);


    if (struct instanceof recoil.frp.Behaviour) {
        struct.set(newVal);
        return;
    }

    if (recoil.frp.struct.getBehaviours(struct).length === 0) {
        return;
    }
    var res;
    if (struct instanceof Array) {
        for (var i = 0; i < struct.length; i++) {
            recoil.frp.struct.setFlatternRec_(struct[i],newVal[i], newPath);
        }
        return;
    }
    if (struct instanceof Object) {
        for (var prop in struct) {
            if (struct.hasOwnProperty(prop)) {
                recoil.frp.struct.setFlatternRec_(struct[prop],newVal[prop],newPath);
            }
        }
        return;
    };
};



recoil.frp.struct.flatternRec_ = function(struct, path) {
    if (path.indexOf(struct) !== -1) {
        return struct; // loop detected;
    }
    var newPath = goog.array.clone(path);
    newPath.push(struct);


    if (struct instanceof recoil.frp.Behaviour) {
        return struct.get();
    }

    if (recoil.frp.struct.getBehaviours(struct).length === 0) {
        return struct;
    }
    var res;
    if (struct instanceof Array) {
        res = [];
        for (var i = 0; i < struct.length; i++) {
            res.push(recoil.frp.struct.flatternRec_(struct[i],newPath));
        }
        return res;
    }
    if (struct instanceof Object) {
        res = {};
        for (var prop in struct) {
            if (struct.hasOwnProperty(prop)) {
                res[prop] = recoil.frp.struct.flatternRec_(struct[prop],newPath);
            }
        }
        return res;
    };
    return struct;
};
    
/**
   * @desc takes a structure which is either a behaviour, or a 
   *       structure with behaviours, and non behaviours in it
   *       and returns a behaviour with a structur in it, note this is inversable
   *       when possible
   * @param {recoil.frp.Frp} frp
   * @param {recoil.frp.Behaviour<Object>|Object} structB
   * @return {recoil.frp.Behaviour<Object>}
   */
recoil.frp.struct.flattern = function (frp, structB) {
    if (structB instanceof recoil.frp.Behaviour) {
        return structB;
    }

    var args = [
        function () {
            return recoil.frp.struct.flatternRec_(structB, []);
        },
        function () {
            return recoil.frp.struct.setFatternRec_(structB, []);

        }
    ];

    recoil.frp.struct.getBehavioursRec_(structB, args, []);

    return frp.liftBI.apply(frp, args);
    
};
/**
 * takes object with the fields being behaviours and converts them into an behaviour with objects in them note: fields
 * that are not behaviours will be lost
 * @param {recoil.frp.Frp} frp
 * @param {Object} struct
 * @return {recoil.frp.Behaviour<Object>}
 */
recoil.frp.struct.create = function(frp, struct) {
    var args = [];

    // calculate function
    args.push(function() {
        var res = {};
        goog.object.forEach(struct, function(obj, key) {
            if (obj instanceof recoil.frp.Behaviour) {
                res[key] = obj.get();
            }
            else {
                // if it is not a behaviour just return it it means we can add constant
                // fields
                res[key] = obj;
            }

        });
        return res;
    });

    // inverse function
    args.push(function(val) {
        goog.object.forEach(struct, function(obj, key) {
            if (obj instanceof recoil.frp.Behaviour) {
                obj.set(val[key]);
            }
            // if not a behaviour it is not inversable

        });
    });

    goog.object.forEach(struct, function(obj) {
        if (obj instanceof recoil.frp.Behaviour) {
            args.push(obj);
        }
    });
    return frp.liftBI.apply(frp, args);

};
