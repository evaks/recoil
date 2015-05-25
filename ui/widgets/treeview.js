goog.provide('recoil.ui.widgets.TreeView');


goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Frp');
// http://closure-library.googlecode.com/git-history/0148f7ecaa1be5b645fabe7338b9579ed2f951c8/closure/goog/demos/index.html
//TreeControl, TreeNode
/**
 * @constructor
 */
recoil.ui.widgets.Tree = function () {
    
};


/**
 * @param {recoil.frp.Frp} frp
 * @constructor
 */
recoil.ui.widgets.TreeView = function(frp) {
    
};

/**
 * @parm {recoil.frp.Behaviour<recoil.ui.widgets.Tree>} value
 */
recoil.ui.widgets.TreeView.attach = function(value) {
    
};

/*
(function( $, undefined ) {
$.extend($.ui, { treeview: { version: "0.0.1" } });

var PROP_NAME = "treeview";



function getNumChildren(value) {
	if (value === undefined) {
		return 0;
	}
	return value.children === undefined ? 0 : value.children.length;
}
function visibleDepth(parentValue) {
	
	function helper(parent, depth) {
		var numChildren = getNumChildren(parentValue);

		if (numChildren == 0) {
			return 1;
		}
		
		if (depth !== 0 || parentValue.showRoot) {
			if (!parentValue.expanded ) {
				return 1;
			}
		}
		var res = 0;
		
		
		for (var item in parentValue.children) {
			var d = helper(parentValue.children[item], depth + 1);
			if (d > res) {
				res = d;
			}
		}
		return res + 1;
		
	}
	return helper(parentValue, 0);
}

function getNodeIconExpanderClass(node) {
	var numChildren =  getNumChildren(node);
	if (numChildren === 0) {
		return "treeview-leaf-exp";
	}
	if (node.expanded) {
		return "treeview-node-open-exp";
	}
	return "treeview-node-closed-exp";
}
function getNodeIconClass(node) {
	var numChildren =  getNumChildren(node);
	if (numChildren === 0) {
		return "treeview-leaf";
	}
	return "treeview-node-open";
}

function cloneArray(start, arr) {
	var res = [];
	
	for (var i = start; i <arr.length; i++) {
		res.push(arr[i]);
	}

	return res;
}

function cloneAndAppend(arr, val) {
	var res = cloneArray(0, arr);
	res.push(val);
	return res;
}

function shallowCopy(object) {
	if (object instanceof Array) {
		var x = cloneArray(0, object);
		return x;
	}
	var res = {};
	for (var i in object) {
		res[i] = object[i];
	}
	return res;
}
function setTreeValue(tree, path, setter) {
	if (path.length === 0) {
		return tree;
	}
	if (!sameVal(path[0], tree)) {
		return tree;
	}
	
	var res = shallowCopy(tree);
	res.children = [];
	
	if (path.length === 1 ) {
		setter(res);
	}


	var newPath = cloneArray(1, path);
	for (var i = 0; i <  tree.children.length; i++) {
		res.children.push(setTreeValue(tree.children[i], newPath, setter));

	}
	
	return res;
	
	
}
function same(x, y) {
	if (x === undefined && y == undefined) {
		return true;
	}
	if (x === undefined || y == undefined) {
		return false;
	}
	return  x.expanded === y.expanded && x.icon === y.icon && x.value === y.value;
}

function sameVal(x, y) {
	if (x === undefined && y == undefined) {
		return true;
	}
	if (x === undefined || y == undefined) {
		return false;
	}
	return  x.icon === y.icon && x.value === y.value;
}

*/
/**
 * this is a minimum edit distance algorithm, 
 * 
 * the edit types are currently insert, delete, (no modify operation, you must parameterise this in order to use it)
 * 
 * the result is a list of objects in the form of {oldValue:? , newValue:?}
 * 
 * if both are defined then no change, 
 * if only oldValue is defined, it was a delete,
 * if only newValue is defined, it was an insert
 * 
 * isEqual is a function that takes 2 items and return if 2 items in the input list are equal.
 */

function minDifference(origList, newList, isEqual) {

	function createDiffGrid(origList, newList, isEqual) {
		
		var grid = [];
		for (var i = 0; i <= origList.length; i++) {
			grid[i] = [];
			grid[i][0] = {val : i};
			if (i !== 0) {
				grid[i][0].oldVal = origList[i -1];
				grid[i][0].i = i -1;
				grid[i][0].j = 0;
			}
			
		}

		for (var i = 0; i <= newList.length; i++) {
			grid[0][i] = {val : i};
			if (i !== 0) {
				grid[0][i].newVal = newList[i -1];
				grid[0][i].i = 0;
				grid[0][i].j = i -1;
			}
		}
		
		for (var i = 1; i <= origList.length; i++) {
			for (var j = 1; j  <= newList.length; j++) {
				if (isEqual(origList[i -1], newList[j-1]) && grid[i-1][j-1].val <= grid[i-1][j].val && grid[i-1][j-1].val <= grid[i][j-1].val) {
					grid[i][j] = {val : grid[i-1][j - 1].val, oldVal : origList[i -1], newVal : newList[j-1], i : i-1, j : j-1}; 
				}
				else if (grid[i][j-1].val < grid[i-1][j].val) {
					grid[i][j] = {val : grid[i][j-1].val + 1, newVal : newList[j-1], i : i, j : j -1}; 
				}
				else {
					grid[i][j] = {val : grid[i - 1][j].val + 1, oldVal: origList[i-1], i : i-1, j : j};
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
			res.push({ oldVal : g.oldVal });
		}
		else if (g.oldVal == undefined) {
			res.push({newVal : g.newVal });
		}
		else {
			res.push({newVal : g.newVal, oldVal : g.oldVal });
		}

		i = g.i;
		j = g.j;
		
	}
	res.reverse();
	return res;
	
}
/*

function printChanges(changes) {
	console.log("*****************************************");
	for (var i in changes) {
		var x = changes[i];
		if (x.oldVal && ! x.newVal) {
			console.log("- '" + x.oldVal + "'");
			
		}
		else if (!x.oldVal &&  x.newVal) {
			console.log("+ '" + x.newVal + "'");
		}
		else {
			console.log("* '" + x.oldVal + " = " + x.newVal + "'");
		}
	}

}
function testMinDifference() {
	printChanges(minDifference([],['a','b', 'c'], function (x, y) { return x == y;}));
	printChanges(minDifference(['a','b', 'c'],[], function (x, y) { return x == y;}));
//	printChanges(minDifference(['a','b', 'c'],['a','c','d'], function (x, y) { return x == y;}));
//	printChanges(minDifference(['a','b', 'c'],['a','b','c'], function (x, y) { return x == y;}));
}

function deleteRowRec(table, delRow, child) {

	table.deleteRow(delRow);
	if (child.expanded) {
		var oldChildren = child.children == undefined  ? [] :  child.children;
		for (var i = 0; i < oldChildren.length; i++) {
			deleteRowRec(table, delRow, oldChildren[i]);
		}		
	}

}
function shouldHide(path, v) {
	return path.length == 1 && v !== undefined && !v.showRoot;
}

function shouldHideParent(path) {
	return path.length == 2 && !path[0].showRoot;
}

function createLine(last, height) {
	
	var outer = DOM.create("td",undefined,"treeview-child");
	var div = DOM.create("div",undefined,"treeview-child-line");
	var tbl = DOM.create("table", undefined,"treeview-child-line");
	
	
	outer.appendChild(tbl);
	var row = DOM.create("tr", undefined,"treeview-child-line");
	if (!last) {
		var l = DOM.create("td", undefined,"treeview-child-line-left");
		var r = DOM.create("td", undefined,"treeview-child-line-right-top");
		r.style.height = height/2 + "px";
		row.appendChild(l);
		row.appendChild(r);
		tbl.appendChild(row);
		row = DOM.create("tr", undefined,"treeview-child-line");
		l = DOM.create("td", undefined,"treeview-child-line-left");
		r = DOM.create("td", undefined,"treeview-child-line-right");
		r.style.height = height/2 + "px";
		row.appendChild(l);
		row.appendChild(r);
	
		
	}
	else {
		var l = DOM.create("td", undefined,"treeview-child-line-left");
		var r = DOM.create("td", undefined,"treeview-child-line-right-top");
		var b = DOM.create("td", undefined,"treeview-child-line-bot");
		r.style.height = (height/2) + "px";
		b.style.height = (height/2) + "px";
		b.colSpan =2;
		row.appendChild(l);
		row.appendChild(r);
		tbl.appendChild(row);
		row = DOM.create("tr", undefined,"treeview-child-line");
		row.appendChild(b);
		
		
	}
	tbl.appendChild(row);
	return outer;

}

function performOnEvent(evtE, action, args) {
	  var args = Array.prototype.slice.call(arguments, 2);
	  
	  var getCur = function (v) {
		    return v instanceof F.Behavior ? v.last : v;
	  };
		  

	  var lastTimeStamp = undefined;
	  var wrapperFunc = function (evt) {
		  var args = Array.prototype.slice.call(arguments, 1);
		  if (evt != undefined && lastTimeStamp !== evt.timeStamp) {
			  	getCur(action).apply(null, args);
			  	lastTimeStamp = evt.timeStamp;
		  }
	  };
	  

	  var params  = [wrapperFunc, evtE.startsWith(undefined).liftB(function(e) {
		  if (e !== undefined) {
			  console.log("evt ts = " + e.timeStamp);
		  }
		  return e;
	  })];
	  for (var i = 0; i < args.length; i++) {
		  params.push(args[i]);
	  }
	  
	  F.liftB.apply(null, params);
		   

}

function populateTree(me, oldValue, parentValue, table, path, maxDepth, oldLastChild, lastChild, curRow) {
	var numChildren =  getNumChildren(parentValue);
	var oldNumChildren = getNumChildren(oldValue);;
	var height = 20;
	var cellWidth = "20px";
	var expanderWidth = 11;

	
	if (oldValue === parentValue) {
		curRow.val++;
		return;
	}

	if (same(oldValue, parentValue) ) {
		if (!shouldHide(path, parentValue)) {
			curRow.val++;
		}
	}
	else {
		var row;
		
		if (oldValue === undefined) {
			if (!shouldHide(path, parentValue)) {
				row = table.insertRow(curRow.val);
				curRow.val++;
			}
		}
		else {
			if (!shouldHide(path, parentValue)) {
				table.deleteRow(curRow.val);
				row = table.insertRow(curRow.val);
				curRow.val++;
			}
		}
		
		if (!shouldHide(path, parentValue)) {
			var indent;
			var i;
			var pathLen = path[0].showRoot ? path.length - 2 : path.length - 3;
			
			for (var i = 0; i < pathLen; i++) {
				indent = DOM.create("td",undefined,"treeview-child-indent");
				indent.style.width = cellWidth;
				row.appendChild(indent);
			}
	
			if (!shouldHideParent(path)) {
				if (path.length > 1) {
					indent = createLine(lastChild, height);

					indent.style.width = cellWidth;
					
					row.appendChild(indent);
				}
			}
	
			
			
			
			var item = parentValue;
			var iconExpander = DOM.create("td", undefined, getNodeIconExpanderClass(item));
			var icon = DOM.create("td", undefined, getNodeIconClass(item));
			
			if (numChildren == 0 && !shouldHideParent(path)) {
				var tbl = DOM.create("table", undefined, "treeview-leaf-line");
				tbl.style.height = height + "px";
				var top = DOM.create("tr", undefined,"treeview-child-line");
				var bottom = DOM.create("tr", undefined,"treeview-child-line");
				tbl.appendChild(top);
				tbl.appendChild(bottom);
				tbl.style.width = expanderWidth + "px";

				top.style.height = (height/2 + 1) + "px";

				top.appendChild(DOM.create("td", undefined,"treeview-leaf-line-bot"));
				bottom.appendChild(DOM.create("td", undefined,"treeview-leaf-line-top"));
				iconExpander.appendChild(tbl);
			}
			if (item.icon !== undefined) {
				icon.style.backgroundImage = "url('"+ item.icon + "')";
			}

			icon.style.width = cellWidth;
			iconExpander.style.width = expanderWidth + "px";
			
			var iconAndItemTd = DOM.create("td", undefined, "treeview-item");
			var iconAndItemTable = DOM.create("table", undefined, "treeview-item");
			
			var iconAndItemRow = DOM.create("tr", undefined, "treeview-item");
			
			iconAndItemRow.style.height = height + "px";
			row.appendChild(iconAndItemTd);
			iconAndItemTd.appendChild(iconAndItemTable);
			iconAndItemTable.appendChild(iconAndItemRow);
			
			//row.appendChild(icon);
			var itemCell = DOM.create("td", undefined, "treeview-item");
			
			iconAndItemTd.colSpan = maxDepth + 1;
			itemCell.appendChild(document.createTextNode
				    (item.value));
			iconAndItemTd.addEventListener('drop', function dropItem (evt) {
					var txt = evt.dataTransfer.getData("TreeViewData");
					if (txt.table === table) {
						console.log("drop my table '" + txt +"'");
					}
					else {
						console.log("drop other source'" + txt +"'");
					}	
					
					evt.preventDefault();
				}
			);
			iconAndItemTd.addEventListener('dragover', function (evt) {
				evt.preventDefault();				
			});
			iconAndItemTd.addEventListener('dragstart',function (evt) {
				evt.dataTransfer.setData("TreeViewData",JSON.stringify({value:item.value, wid : window.id}));
				
				for (var xx in window) {
					console.log("xxx" + xx);
				}
			});
			iconAndItemTd.draggable = true;
			
			
			if (getNumChildren(item) > 0) {
				var expand = function (tree) {
					
					var rootB = me.state.behaviour;

					
					console.log("setting tree");
					var newTree = setTreeValue (tree, path,  function(curItem) {
						curItem.expanded = !item.expanded;						
					});
					console.log("setting tree done");
					rootB.set(newTree);
				};

				
				
				(function  (itemCell, iconExpander, rootB) {
					performOnEvent(F.mergeE(F.clicksE(iconExpander),F.clicksE(icon)), expand, rootB);
				})(itemCell, iconExpander, me.state.behaviour);
			}
			
			iconAndItemTd.appendChild(iconAndItemRow);
			
			iconAndItemRow.appendChild(iconExpander);
		
			iconAndItemRow.appendChild(icon);
			iconAndItemRow.appendChild(itemCell);
			
			row.appendChild(iconAndItemTd);
		}
	}
	
	img = new Image;
	
	img.onload = function() {
//		console.log("WIDTH = " + this.width);
		
	};
	img.src = "/resources/images/error.png";
	
	if (parentValue.expanded || shouldHide(path, parentValue)) {
		var childCount = 0;
		var oldChildCount = 0;
		var oldChildren = (oldValue == undefined  || oldValue.children == undefined || !(oldValue.expanded || shouldHide(path, parentValue)) ) ? [] :  oldValue.children;
		var differences = minDifference(oldChildren,parentValue.children, sameVal);
		for (var idx in differences) {
			var diff = differences[idx];
			if (diff.oldVal !== undefined && diff.newVal !== undefined) {
				childCount++;
				oldChildCount++;
				newPath = cloneAndAppend(path, diff.newVal);
				populateTree(me, diff.oldVal, diff.newVal, table, newPath, maxDepth -1, oldChildCount === oldNumChildren, childCount == numChildren, curRow);
			}
			else if (diff.oldVal !== undefined) {
				// delete the row
				table.deleteRow(curRow.val);
				oldChildCount++;
			}
			else if (diff.newVal !== undefined) {
				childCount++;
				newPath = cloneAndAppend(path, diff.newVal);
				populateTree(me, diff.oldVal, diff.newVal, table, newPath, maxDepth -1, oldChildCount === oldNumChildren, childCount == numChildren, curRow);
				
			}
		}
	} else if (oldValue != undefined && oldValue.expanded) {
		var oldChildren = oldValue.children == undefined  ? [] :  oldValue.children;
		for (var i = 0; i < oldChildren.length; i++) {
			deleteRowRec(table, curRow.val, oldChildren[i]);
		}
	}
		
	

	
}

function populateFullTree(me) {
	
	if (me.state.displayedRoot !== undefined) {
		if (me.state.displayedRoot.showRoot !== me.state.root.showRoot) {
			deleteRowRec(me.table, 0, me.state.displayedRoot);
			me.state.displayedRoot = undefined;
		}
	}
	populateTree(me, me.state.displayedRoot, me.state.root,me.table,[me.state.root], visibleDepth(me.state.root), false, false, {val:0});
	me.state.displayedRoot= me.state.root;
	
	
}
$.fn.treeview = function(options) {

	return this.each(function(){
	    return;
		var wasUndefined = this.state === undefined;
		if (wasUndefined ) {
			this.state = new TreeViewState($(this));
			this.table = DOM.create('table',undefined, "treeview");
			var me = this;
			var e = F.receiverE();
			
			var count = 0;
			var dataB = F.timerE(1000).mapE(function () {
				count++;
				return {
					showRoot : true,
					"value" : "root item",
					"children": [{icon : "/resources/images/down_arrow.png", value : "item " + count}, {value : "item 2", children : [{ value : "item 2.1" }, {value : "item 2.2", children: [{value : "item 2.2.1"}]}]}]
				};
			}).startsWith(undefined);
		
			var stateB = F.liftBI(function (val) {
				return val;
			}, function (val) {
				return [undefined];
			}, F.oneE());
			
			var b = F.liftBI(function (state, data) {
				return mergeState(data, state);
			}, function (val) {
				var res = mergeStateInverse(val);
				return [res.state, res.data];
			},stateB, dataB);
			
			this.state.behaviour = b;
			
			b.liftB(function(val) {
				me.state.root = val;
				populateFullTree(me);
			});

		}
		
		populateFullTree(this);
		
		if (wasUndefined) {
			this.appendChild(this.table);
		}
		
		
	});
*/
	/**
	 * 
	 */
/*
	function mergeOptions (tree, options ) {
		var res = {};
		for (var attrib in tree) {
			res[attrib] = tree[attrib];
		}
		
		for (attrib in options) {
			res[attrib] = options[attrib];
		}
		
	}

	function mergeOptionsInverse (merged, options ) {
		var res = {options:{}, tree:{}};
		for (var attrib in merged) {
			if (options[attrib] === undefined) {
				res.options[attrib] = merged[options];
			}
			else {
				res.tree[attrib] = merged[attrib];
			}
		}
		return res;
	}

	function mergeState(dataTree, stateTree) {
		
		if (dataTree === undefined) {
			return undefined;
		}
		var newNode = {icon : dataTree.icon,  value : dataTree.value, children : []};
		if (stateTree !== undefined) {
			newNode.expanded = stateTree.expanded;
		}
		
		var numChildren = getNumChildren(dataTree);
		for (var i = 0; i < numChildren; i++) {
			if (stateTree === undefined || stateTree.children === undefined) {
				newNode.children.push(mergeState(dataTree.children[i], stateTree));
			}
			else {
				newNode.children.push(mergeState(dataTree.children[i], stateTree.children[i]));
			}
		}
		return newNode;
	}

	function mergeStateInverse(merged) {
		var res = {data : {icon : merged.icon, value : merged.value, children :[]}, state : {expanded : merged.expanded, children :[]}};
		var numChildren = getNumChildren(merged);
		for (var i = 0; i < numChildren; i++) {
			var child = mergeStateInverse(merged.children[i]);
			res.data.children.push(child.data);
			res.state.children.push(child.state);
		}
		return res;
	}

};


$.treeview = function() {
	alert("tree view func");
};


function TreeViewState (target) {
	

	this.root = undefined;
	this.displayedRoot = undefined;
}

}(jQuery));*/
