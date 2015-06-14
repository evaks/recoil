console.log("loading tree view");
goog.provide('recoil.ui.widgets.TreeView');

goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Frp');
goog.require('recoil.ui.WidgetHelper')
goog.require('recoil.frp.struct');
goog.require('recoil.structs.Tree');
goog.require('goog.ui.tree.TreeControl');
goog.require('goog.structs.TreeNode');
goog.require('goog.html.SafeHtml');
goog.require('goog.fx.DragDrop')


// http://closure-library.googlecode.com/git-history/0148f7ecaa1be5b645fabe7338b9579ed2f951c8/closure/goog/demos/index.html
// TreeControl, TreeNode
/**
 * @constructor
 */
recoil.ui.widgets.Tree = function() {

};

/**
 * @param {recoil.ui.WidgetScope} scope
 * @param {Element} container the container that the tree will go into
 * 
 * @constructor
 */
recoil.ui.widgets.TreeView = function(scope, container) {
    var me = this;
    this.container_ = container;
    /**
     * @private
     * @type goog.ui.tree.TreeControl
     * 
     */
    this.tree_ = null;
    /**
     * @private
     * @type recoil.structs.Tree
     */
    this.oldTree_ = null;
    this.config_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateConfig_);
    this.state_ = new recoil.ui.WidgetHelper(scope, container, this, this.updateTree_);

};

/**
 * callback handler that gets called when the configuration for the widget
 * gets changed 
 * 
 * @param helper
 */
recoil.ui.widgets.TreeView.prototype.updateConfig_ = function(helper) {
    var me = this;
    var good = helper.isGood();

    if (good) {
        if (me.tree_ !== null) {
            goog.dom.removeChildren(this.container_);
        }
        var treeConfig = helper.value();
        me.tree_ = new goog.ui.tree.TreeControl('root', treeConfig);
        // now force the tree to re-render since we just destroyed
        me.tree_.render(me.container_);
        // and created a new one
        me.state_.forceUpdate();
    } else if (me.tree_ !== null) {
        // TODO implement disable tree
    }

};

recoil.ui.widgets.TreeView.prototype.updateTree_ = function(helper) {
    var good = helper.isGood();

    if (this.tree_ !== null) {
        if (good) {
            var newValue = this.state_.value();
            this.populateTreeRec_(null, this.tree_, this.oldValue_, newValue);
            this.oldValue_ = newValue;
        } else {
            // TODO disable tree
        }
    }
};

/**
 * @param {recoil.frp.Behaviour<recoil.ui.widgets.Tree>} value
 */
recoil.ui.widgets.TreeView.prototype.attach = function(value) {

    // order is important here since we need config to always fire before the others

    this.config_.attach(recoil.frp.struct.get('config', value, goog.ui.tree.TreeControl.defaultConfig));
    this.state_.attach(recoil.frp.struct.get('state', value));

};
/**
 * tests if the values of the nodes are the same
 * @private 
 * @param {recoil.structs.Tree} a 
 * @param {recoil.structs.Tree} b
 * @return {!boolean}
 */
recoil.ui.widgets.TreeView.same_ = function (a, b) {
    return recoil.util.isEqual(a.value(), b.value());
}
/**
 * @param {goog.ui.tree.BaseNode} parent
 * @param {goog.ui.tree.BaseNode} node
 * @param {recoil.structs.Tree} oldValue 
 * @param {recoil.structs.Tree} newValue
 */
recoil.ui.widgets.TreeView.prototype.populateTreeRec_ = function(parent, node, oldValue, newValue) {
    // var numChildren = getNumChildren(parentValue);
    // var oldNumChildren = getNumChildren(oldValue);;

    if (oldValue === newValue) {
        return;
    }
    var me = this;
    if (newValue === null || newValue === undefined) {
        if (node !== undefined) {
            parent.removeChild(node);
        }
        return;
    } 
    else if (oldValue === undefined || oldValue === null) {
        node.setSafeHtml(goog.html.SafeHtml.htmlEscape(newValue.value()));
        newValue.children().forEach(function(child) {
            var newNode = me.tree_.createNode('');
            me.populateTreeRec_(node, newNode, null, child);
            // we have to add after otherwise the folder icon is incorrect
            node.addChild(newNode);
        });
        return;
    }
    else if (recoil.util.isEqual(oldValue.value(), newValue.value())) {
        // do nothing
    }
    else {
        node.setSafeHtml(goog.html.SafeHtml.htmlEscape(newValue.value()));
    }

    
    
    var differences = recoil.ui.widgets.TreeView.minDifference(oldValue.children(), newValue.children(), recoil.ui.widgets.TreeView.same_);

    var childIndex = 0;
    for ( var idx in differences) {
        var diff = differences[idx];
        var childNode = node.getChildAt(childIndex);
        if (diff.oldVal !== undefined && diff.newVal !== undefined) {
            this.populateTreeRec_(node, childNode, diff.oldVal, diff.newVal);
            childIndex++;
        } else if (diff.newVal === undefined) {
            node.removeChild(childNode);
        } else if (diff.oldVal === undefined) {
            childNode = this.tree_.createNode('');
            node.addChildAt(childNode, childIndex);
            childIndex++;
            this.populateTreeRec_(node, childNode, undefined, diff.newVal);
        }
    }

}

/*
 * (function( $, undefined ) { $.extend($.ui, { treeview: { version: "0.0.1" } });
 * 
 * var PROP_NAME = "treeview";
 * 
 * 
 * function getNumChildren(value) { if (value === undefined) { return 0; } return value.children === undefined ? 0 :
 * value.children.length; }
 * 
 * function cloneArray(start, arr) { var res = [];
 * 
 * for (var i = start; i <arr.length; i++) { res.push(arr[i]); }
 * 
 * return res; }
 * 
 * function cloneAndAppend(arr, val) { var res = cloneArray(0, arr); res.push(val); return res; }
 * 
 * function shallowCopy(object) { if (object instanceof Array) { var x = cloneArray(0, object); return x; } var res =
 * {}; for (var i in object) { res[i] = object[i]; } return res; } function setTreeValue(tree, path, setter) { if
 * (path.length === 0) { return tree; } if (!sameVal(path[0], tree)) { return tree; }
 * 
 * var res = shallowCopy(tree); res.children = [];
 * 
 * if (path.length === 1 ) { setter(res); }
 * 
 * 
 * var newPath = cloneArray(1, path); for (var i = 0; i < tree.children.length; i++) {
 * res.children.push(setTreeValue(tree.children[i], newPath, setter)); }
 * 
 * return res;
 *  } function same(x, y) { if (x === undefined && y == undefined) { return true; } if (x === undefined || y ==
 * undefined) { return false; } return x.expanded === y.expanded && x.icon === y.icon && x.value === y.value; }
 * 
 * function sameVal(x, y) { if (x === undefined && y == undefined) { return true; } if (x === undefined || y ==
 * undefined) { return false; } return x.icon === y.icon && x.value === y.value; }
 * 
 */
/**
 * this is a minimum edit distance algorithm,
 * 
 * the edit types are currently insert, delete, (no modify operation, you must parameterise this in order to use it)
 * 
 * the result is a list of objects in the form of {oldValue:? , newValue:?}
 * 
 * if both are defined then no change, if only oldValue is defined, it was a delete, if only newValue is defined, it was
 * an insert
 * 
 * isEqual is a function that takes 2 items and return if 2 items in the input list are equal.
 */

recoil.ui.widgets.TreeView.minDifference = function(origList, newList, isEqual) {

    function createDiffGrid(origList, newList, isEqual) {

        var grid = [];
        for (var i = 0; i <= origList.length; i++) {
            grid[i] = [];
            grid[i][0] = {
                val: i
            };
            if (i !== 0) {
                grid[i][0].oldVal = origList[i - 1];
                grid[i][0].i = i - 1;
                grid[i][0].j = 0;
            }

        }

        for (var i = 0; i <= newList.length; i++) {
            grid[0][i] = {
                val: i
            };
            if (i !== 0) {
                grid[0][i].newVal = newList[i - 1];
                grid[0][i].i = 0;
                grid[0][i].j = i - 1;
            }
        }

        for (var i = 1; i <= origList.length; i++) {
            for (var j = 1; j <= newList.length; j++) {
                if (isEqual(origList[i - 1], newList[j - 1]) && grid[i - 1][j - 1].val <= grid[i - 1][j].val && grid[i - 1][j - 1].val <= grid[i][j - 1].val) {
                    grid[i][j] = {
                        val: grid[i - 1][j - 1].val,
                        oldVal: origList[i - 1],
                        newVal: newList[j - 1],
                        i: i - 1,
                        j: j - 1
                    };
                } else if (grid[i][j - 1].val < grid[i - 1][j].val) {
                    grid[i][j] = {
                        val: grid[i][j - 1].val + 1,
                        newVal: newList[j - 1],
                        i: i,
                        j: j - 1
                    };
                } else {
                    grid[i][j] = {
                        val: grid[i - 1][j].val + 1,
                        oldVal: origList[i - 1],
                        i: i - 1,
                        j: j
                    };
                }
            }
        }
        return grid;
    }

    var grid = createDiffGrid(origList, newList, isEqual);

    var res = [];
    var i = origList.length;
    var j = newList.length;

    while (i !== 0 || j !== 0) {
        var g = grid[i][j];
        if (g.newVal == undefined) {
            res.push({
                oldVal: g.oldVal
            });
        } else if (g.oldVal == undefined) {
            res.push({
                newVal: g.newVal
            });
        } else {
            res.push({
                newVal: g.newVal,
                oldVal: g.oldVal
            });
        }

        i = g.i;
        j = g.j;

    }
    res.reverse();
    return res;

}
/*
 * 
 * function printChanges(changes) { console.log("*****************************************"); for (var i in changes) {
 * var x = changes[i]; if (x.oldVal && ! x.newVal) { console.log("- '" + x.oldVal + "'"); } else if (!x.oldVal &&
 * x.newVal) { console.log("+ '" + x.newVal + "'"); } else { console.log("* '" + x.oldVal + " = " + x.newVal + "'"); } } }
 * function testMinDifference() { printChanges(minDifference([],['a','b', 'c'], function (x, y) { return x == y;}));
 * printChanges(minDifference(['a','b', 'c'],[], function (x, y) { return x == y;})); //
 * printChanges(minDifference(['a','b', 'c'],['a','c','d'], function (x, y) { return x == y;})); //
 * printChanges(minDifference(['a','b', 'c'],['a','b','c'], function (x, y) { return x == y;})); }
 * 
 * function deleteRowRec(table, delRow, child) {
 * 
 * table.deleteRow(delRow); if (child.expanded) { var oldChildren = child.children == undefined ? [] : child.children;
 * for (var i = 0; i < oldChildren.length; i++) { deleteRowRec(table, delRow, oldChildren[i]); } } } function
 * shouldHide(path, v) { return path.length == 1 && v !== undefined && !v.showRoot; }
 * 
 * function shouldHideParent(path) { return path.length == 2 && !path[0].showRoot; }
 * 
 * 
 * function performOnEvent(evtE, action, args) { var args = Array.prototype.slice.call(arguments, 2);
 * 
 * var getCur = function (v) { return v instanceof F.Behavior ? v.last : v; };
 * 
 * 
 * var lastTimeStamp = undefined; var wrapperFunc = function (evt) { var args = Array.prototype.slice.call(arguments,
 * 1); if (evt != undefined && lastTimeStamp !== evt.timeStamp) { getCur(action).apply(null, args); lastTimeStamp =
 * evt.timeStamp; } };
 * 
 * 
 * var params = [wrapperFunc, evtE.startsWith(undefined).liftB(function(e) { if (e !== undefined) { console.log("evt ts = " +
 * e.timeStamp); } return e; })]; for (var i = 0; i < args.length; i++) { params.push(args[i]); }
 * 
 * F.liftB.apply(null, params);
 *  }
 * 
 * 
 * function populateFullTree(me) {
 * 
 * if (me.state.displayedRoot !== undefined) { if (me.state.displayedRoot.showRoot !== me.state.root.showRoot) {
 * deleteRowRec(me.table, 0, me.state.displayedRoot); me.state.displayedRoot = undefined; } } populateTree(me,
 * me.state.displayedRoot, me.state.root,me.table,[me.state.root], visibleDepth(me.state.root), false, false, {val:0});
 * me.state.displayedRoot= me.state.root;
 *  } $.fn.treeview = function(options) {
 * 
 * return this.each(function(){ return; var wasUndefined = this.state === undefined; if (wasUndefined ) { this.state =
 * new TreeViewState($(this)); this.table = DOM.create('table',undefined, "treeview"); var me = this; var e =
 * F.receiverE();
 * 
 * var count = 0; var dataB = F.timerE(1000).mapE(function () { count++; return { showRoot : true, "value" : "root
 * item", "children": [{icon : "/resources/images/down_arrow.png", value : "item " + count}, {value : "item 2", children : [{
 * value : "item 2.1" }, {value : "item 2.2", children: [{value : "item 2.2.1"}]}]}] }; }).startsWith(undefined);
 * 
 * var stateB = F.liftBI(function (val) { return val; }, function (val) { return [undefined]; }, F.oneE());
 * 
 * var b = F.liftBI(function (state, data) { return mergeState(data, state); }, function (val) { var res =
 * mergeStateInverse(val); return [res.state, res.data]; },stateB, dataB);
 * 
 * this.state.behaviour = b;
 * 
 * b.liftB(function(val) { me.state.root = val; populateFullTree(me); }); }
 * 
 * populateFullTree(this);
 * 
 * if (wasUndefined) { this.appendChild(this.table); }
 * 
 * 
 * });
 */
/**
 * 
 */
/*
 * function mergeOptions (tree, options ) { var res = {}; for (var attrib in tree) { res[attrib] = tree[attrib]; }
 * 
 * for (attrib in options) { res[attrib] = options[attrib]; } }
 * 
 * function mergeOptionsInverse (merged, options ) { var res = {options:{}, tree:{}}; for (var attrib in merged) { if
 * (options[attrib] === undefined) { res.options[attrib] = merged[options]; } else { res.tree[attrib] = merged[attrib]; } }
 * return res; }
 * 
 * function mergeState(dataTree, stateTree) {
 * 
 * if (dataTree === undefined) { return undefined; } var newNode = {icon : dataTree.icon, value : dataTree.value,
 * children : []}; if (stateTree !== undefined) { newNode.expanded = stateTree.expanded; }
 * 
 * var numChildren = getNumChildren(dataTree); for (var i = 0; i < numChildren; i++) { if (stateTree === undefined ||
 * stateTree.children === undefined) { newNode.children.push(mergeState(dataTree.children[i], stateTree)); } else {
 * newNode.children.push(mergeState(dataTree.children[i], stateTree.children[i])); } } return newNode; }
 * 
 * function mergeStateInverse(merged) { var res = {data : {icon : merged.icon, value : merged.value, children :[]},
 * state : {expanded : merged.expanded, children :[]}}; var numChildren = getNumChildren(merged); for (var i = 0; i <
 * numChildren; i++) { var child = mergeStateInverse(merged.children[i]); res.data.children.push(child.data);
 * res.state.children.push(child.state); } return res; } };
 * 
 * 
 * $.treeview = function() { alert("tree view func"); };
 * 
 * 
 * function TreeViewState (target) {
 * 
 * 
 * this.root = undefined; this.displayedRoot = undefined; }
 * 
 * }(jQuery));
 */
