goog.provide('recoil.debugger.ObjectBrowser');

goog.require('goog.dom');
goog.require('goog.ui.tree.TreeControl');
goog.require('goog.ui.tree.TreeNode');
goog.require('recoil.ui.Widget');

/**
 * @param {Element} container
 * @constructor
 */
recoil.debugger.ObjectBrowser = function(container) {
    this.tree_ = new goog.ui.tree.TreeControl('?');
    this.tree_.setShowRootNode(false);
    this.tree_.setShowRootLines(false);
    this.tree_.render(container);
};

/**
 * tries to convert an item into a string if it is not too long
 *
 * @param {?} val the thing to turn into a string
 * @param {!string} def what to return if anable to convert to string
 * @return {!string}
 */
recoil.debugger.ObjectBrowser.prototype.shortStringify = function(val, def) {
    try {
        var str = JSON.stringify(val);
        if (str.length > 20) {
            return def;
        }
        return str;
    }
    catch (e) {
        return def;
    }
};

/**
 * make the value into a safe html
 * @param {?} val
 * @return {!goog.html.SafeHtml|string}
 */
recoil.debugger.ObjectBrowser.prototype.typeToSafeHtml = function(val) {
    var type = typeof (val);
    if (type === 'number') {
        if (isNaN(val)) {
            return goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-number'}, 'NaN');
        }

        if (isNaN(val)) {
            return goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-number'}, 'NaN');
        }
        if (isFinite(val)) {
            return goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-number'},JSON.stringify(val));
        }

        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-number'},val < 0 ? '-Infinity' : 'Infinity');

    }
    if (val === null) {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-null'},
            this.shortStringify(val, JSON.stringify(val)));
    }
    if (val === undefined) {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-null'},
            this.shortStringify(val, 'undefined'));
    }
    if (val instanceof recoil.frp.Behaviour) {
        var meta = val.unsafeMetaGet();
        var refs = val.hasRefs();
        var res;
        if (meta.good()) {
            res = this.typeToSafeHtml(meta.get());
        }
        else if (meta.errors().length > 0) {
            res = goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-behaviour'},
                [
                    goog.html.SafeHtml.create(
                        'div', {class: 'recoil-debugger-behaviour-error'}, 'Error'),
                    this.typeToSafeHtml(meta.errors())]);

        }
        else {
            res = goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-behaviour-not-ready'},
                'Not Ready');
        }
        if (!val.hasRefs()) {
            res = goog.html.SafeHtml.create(
                'div', {class: 'recoil-debugger-behaviour'},
                [
                    goog.html.SafeHtml.create(
                        'div', {class: 'recoil-debugger-behaviour-no-ref'}, 'No Ref'),
                    res]);
        }

        return res;

    }
    if (val instanceof Array) {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-array'},
            this.shortStringify(val, '[...]'));
    }

    if (val instanceof Function) {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-function'},'()');
    }

    if (val instanceof Object) {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-object'},
            this.shortStringify(val, '{...}'));
    }


    if (type === 'string') {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-string'},JSON.stringify(val));
    }



    if (type === 'boolean') {
        return goog.html.SafeHtml.create(
            'div', {class: 'recoil-debugger-string'},JSON.stringify(val));
    }

    return '' + val;
};
/**
 * @private
 * @param {?} obj
 * @return {!Array<function(?):?>}
 */
recoil.debugger.ObjectBrowser.prototype.getChildKeys_ = function(obj) {
    var getAttr = function(attr) {
        var res = function(obj) {
            return obj[attr];
        };
        res.aname = attr;
        return res;
    };

    var calcAttr = function(attr, func) {
        var res = function(obj) {
            return func(obj);
        };
        res.aname = attr;
        return res;
    };
    var res = [];
    if (obj instanceof recoil.frp.Behaviour) {

        res.push(calcAttr('value', function(b) {
            var v = b.unsafeMetaGet();
            return b.unsafeMetaGet().get();
        }));
        res.push(calcAttr('ready', function(b) {
            return b.unsafeMetaGet().ready();
        }));
        if (obj.unsafeMetaGet().errors().length > 0) {
            res.push(calcAttr('errors', function(b) {
                return b.unsafeMetaGet().errors();
            }));
        }
        res.push(calcAttr('name', function(b) {
            return b.name_;
        }));
        res.push(calcAttr('origSeq', function(b) {
            return b.origSeq_;
        }));
        res.push(calcAttr('curSeq', function(b) {
            return b.seqStr_;
        }));
        res.push(calcAttr('providers', function(b) {
            return b.providers_;
        }));
        res.push(calcAttr('dependants', function(b) {
            return b.getDependants();
        }));
    } else if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
            res.push(getAttr('' + i));
        }
        res.push(getAttr('length'));

    }
    else if (obj instanceof Object) {
        if (obj instanceof Function) {
            res.push(getAttr('arguments'));
            res.push(getAttr('caller'));
            res.push(getAttr('length'));
            res.push(getAttr('name'));
            res.push(getAttr('prototype'));

        }
        for (var k in obj) {
            res.push(getAttr(k));
        }
    }
    return res;

};

recoil.debugger.ObjectBrowser.prototype.createNodeHtml_ = function (name, obj) {
    return goog.html.SafeHtml.create(
        'div', {style: {display: 'inline-block'}},
        [
            goog.html.SafeHtml.create('b', undefined, name + suffix),
            this.typeToSafeHtml(obj)
            
        ]
    );
};
/**
 * @private
 * @param {string} name
 * @param {?} obj
 * @param {number} depth
 * @return {goog.ui.tree.TreeNode}
 */
recoil.debugger.ObjectBrowser.prototype.createNode_ = function(name, obj, depth) {

    var suffix = obj instanceof Function ? '' : ':';
    var node = new goog.ui.tree.TreeNode(this.createNodeHtml_(name, obj));

    var childCount = 0;
    var childMap = {};

    var childKeys = this.getChildKeys_(obj);
    for (var i = 0; i < childKeys.length; i++) {
        var k = childKeys[i];
        if (depth > 0) {
            var child = this.createNode_(node, k.aname, k(obj), depth - 1);
            node.add(child);
            childMap[k.aname] = {node: child, val: k(obj), getter: k};
        }

    }



    var me = this;
    goog.events.listen(node, goog.ui.tree.BaseNode.EventType.BEFORE_EXPAND,
                       function() {
                           for (var childKey in childMap) {
                               var child = childMap[childKey];
                               if (!child.expanded) {
                                   var keys = me.getChildKeys_(child.val);

                                   for (var i = 0; i < keys.length; i++) {
                                       var key = keys[i];
                                       var val = key(child.val);
                                       me.createNode_(child.node, key.aname, val, 1);
                                   }
                                   child.expanded = true;
                               }
                           }
                       });

    return node;
};
/**
 * add an object to the object browser
 * @param {!string} name
 * @param {?} obj
 */
recoil.debugger.ObjectBrowser.prototype.setItems = function(items) {
    this.setItemsRec_(this.tree_, items, this.oldItems_);
};
recoil.debugger.ObjectBrowser.prototype.setItemsRec_ = function(node, items, oldItems) {

    var diffs = recoil.ui.widgets.TreeView.minDifference(this.oldItems_ || [], items, diffFunc);

    var childIndex = 0;
    for (var idx = 0; idx < diffs.length; idx++) {
        var diff = diffs[idx];
        var childNode = node.getChildAt(childIndex);
        var newPath;
        if (diff.oldVal !== undefined && diff.newVal !== undefined) {
            childNode.setSafeHtml();
            this.updateNode_(node, childNode, newPath, diff.oldVal, diff.newVal);
            childIndex++;
        } else if (diff.newVal === undefined) {
            node.removeChild(childNode);
        } else if (diff.oldVal === undefined) {
            childNode = this.createNode(name, obj, 1);
            node.addChildAt(childNode, childIndex);
            childIndex++;
        }
    }

    this.createNode_(this.tree_, name, obj, 1);


};
