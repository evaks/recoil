goog.provide('recoil.util.regexp.CharRange');
goog.provide('recoil.util.regexp.DFA');
goog.provide('recoil.util.regexp.EdgeSet');
goog.provide('recoil.util.regexp.NFA');



goog.require('goog.structs.AvlTree');

/**
 * @constructor
 * @param {?boolean} start match start of string
 * @param {?boolean} end match end of string
 * @param {!Array<!{start:string,end:string}>} ranges
 */
recoil.util.regexp.CharRange = function(start, end, ranges) {
    var sorted = ranges.splice(0);
    sorted.sort(recoil.util.regexp.CharRange.compare_);
    // now remove any overlaps
    var normalized = [];
    if (ranges.length > 0) {
        var prev = ranges[0];
        for (var i = 1; i < ranges.length; i++) {
            var cur = ranges[i];
            if (prev.end < cur.start) {
                normalized.push(prev);
                prev = cur;
            }
            else {
                prev = {start: prev.start, end: cur.end};
            }
        }
        normalized.push(prev);
    }
    this.ranges_ = normalized;
    this.start_ = start;
    this.end_ = end;
};

/**
 * @private
 * @param {!{start:string,end:string}} x
 * @param {!{start:string,end:string}} y
 * @return {!number}
 */
recoil.util.regexp.CharRange.compare_ = function(x, y) {
    var res = x.start.localeCompare(y.start);
    if (res) {
        return res;
    }
    return x.end.localeCompare(y.end);
};

/**
 * @param {...(!Array<string>|string)} var_ranges
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.CharRange.ranges = function(var_ranges) {
    var ranges = [];

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (arg instanceof Array) {
            ranges.push({start: arg[0], end: arg[1]});
        }
        else {
            ranges.push({start: arg, end: arg});
        }
    }
    return new recoil.util.regexp.CharRange(null, null, ranges);
};
/**
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.CharRange.all = function() {
    return new recoil.util.regexp.CharRange(null, null, [{start: '\0', end: '\uffff'}]);
};

/**
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.CharRange.start = function() {
    return new recoil.util.regexp.CharRange(true, null, []);
};


/**
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.CharRange.end = function() {
    return new recoil.util.regexp.CharRange(null, true, []);
};

/**
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.CharRange.prototype.not = function() {
    var newRanges = [];
    var prev = 0;

    for (var i = 0; this.ranges_.length; i++) {
        var cur = this.ranges_[i];
        var curCC = cur.start.charCodeAt(0);
        if (prev < curCC) {
            newRanges.push({start: String.fromCharCode(prev), end: String.fromCharCode(curCC - 1)});
        }
    }
    if (prev < 0xffff) {
        newRanges.push({start: String.fromCharCode(prev), end: '\uffff'});
    }

    return new recoil.util.regexp.CharRange(
        this.start_ === null ? null : !this.start_,
        this.end_ === null ? null : !this.end_, newRanges);
};


/**
 * @interface
 */
recoil.util.regexp.EdgeSet = function() {};

/**
 * @param {function(?recoil.util.regexp.CharRange,!recoil.util.regexp.Node)} callback
 */
recoil.util.regexp.EdgeSet.prototype.forEachEdge = function(callback) {};

/**
 * @param {?recoil.util.regexp.CharRange} charSet null is lamda
 * @param {!recoil.util.regexp.Node} node
 */
recoil.util.regexp.EdgeSet.prototype.addEdge = function(charSet, node) {};

/**
 * @implements {recoil.util.regexp.EdgeSet}
 * @constructor
 */
recoil.util.regexp.GenericEdgeSet = function() {
    /**
     * @private
     * @type {!Array<{node:!recoil.util.regexp.Node,chars:?recoil.util.regexp.CharRange}>}
     */
    this.edges_ = [];
};

/**
 * @param {?recoil.util.regexp.CharRange} charSet
 * @param {!recoil.util.regexp.Node} node
 */
recoil.util.regexp.GenericEdgeSet.prototype.addEdge = function(charSet, node) {
    this.edges_.push({node: node, chars: charSet});
};

/**
 * @param {function(?recoil.util.regexp.CharRange,!recoil.util.regexp.Node)} callback
 */
recoil.util.regexp.GenericEdgeSet.prototype.forEachEdge = function(callback) {
    this.edges_.forEach(function(e) {
        callback(e.chars, e.node);
    });
};


/**
 * @constructor
 * @param {recoil.util.regexp.Node=} opt_node if provided copies data in node but not edges
 */
recoil.util.regexp.Node = function(opt_node) {
    this.edges_ = new recoil.util.regexp.GenericEdgeSet();
    this.accepting_ = opt_node ? opt_node.accepting_ : false;
};

/**
 * @param {?recoil.util.regexp.CharRange} charSet
 * @param {!recoil.util.regexp.Node} node
 */
recoil.util.regexp.Node.prototype.edge = function(charSet, node) {
    this.edges_.addEdge(charSet, node);
};
/**
 * @interface
 */
recoil.util.regexp.FA = function() {};


/**
 * no recursion here we have no idea how big this is
 * @param {!recoil.util.regexp.Node} node
 * @param {!function(!recoil.util.regexp.Node)} cb
 */
recoil.util.regexp.Node.traverse = function(node, cb) {
    var todo = [node];
    var seen = new WeakMap();
    seen.set(node, node);
    while (todo.length > 0) {
        var cur = todo.shift();
        cb(cur);
        node.edges_.forEachEdge(function(charRange, otherNode) {
            if (!seen.get(otherNode)) {
                todo.push(otherNode);
                seen.set(otherNode, otherNode);
            }
        });
    }
};

/**
 * @implements {recoil.util.regexp.FA}
 * @param {!recoil.util.regexp.Node} start
 * @param {!recoil.util.regexp.Node} end
 * @constructor
 */
recoil.util.regexp.NFA = function(start, end) {

    var node = new recoil.util.regexp.Node();
    /**
     * @type {!recoil.util.regexp.Node}
     */
    this.start = start;
    /**
     * @type {!recoil.util.regexp.Node}
     */
    this.end = end;
};

/**
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.NFA.prototype.clone = function() {
    var nodeMap = new WeakMap();
    // make a copy of all the nodes
    var keep = [];
    recoil.util.regexp.Node.traverse(this.start, function(node) {
        var n = new recoil.util.regexp.Node(node);
        nodeMap.set(node, n);
        // otherwize the map looses them
        keep.push(n);
    });

    
    recoil.util.regexp.Node.traverse(this.start, function(node) {
        var newMe = nodeMap.get(node);

        node.edges_.forEachEdge(function(charRange, node) {
            newMe.edge(charRange, nodeMap.get(node));
        });
    });

    return new recoil.util.regexp.NFA(nodeMap.get(this.start), nodeMap.get(this.end));
};

/**
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.NFA.empty = function() {
    var n = new recoil.util.regexp.Node();
    return new recoil.util.regexp.NFA(n, n);
};


/**
 * @param {!recoil.util.regexp.NFA} toRepeat
 * @param {!number} min
 * @param {!number} max if 0 infinite
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.NFA.repeat = function(toRepeat, min, max) {
    var cur = toRepeat;
    var prev = toRepeat;
    for (var i = 0; i < min; i++) {
        prev = toRepeat.clone();
        /*
         * (cur.start) ... (cur.end) -> (prev.start) ... (prev.end)
         */
        cur = recoil.util.regexp.NFA.append(cur, prev);
    }

    if (max === 0) {
        /*
         *  ...  -> (prev.start) ... (prev.end)
         *             \-----<---------/
         */
        cur.end.edge(null, prev.start);
    }
    else if (max < min) {
        throw 'Min > Max Range';
    }
    else {
        for (; i < max; i++) {
            var start = new recoil.util.regexp.Node();
            var end = new recoil.util.regexp.Node();
            var next = toRepeat.clone();
            /*
             * can skip the middle bit because it is otional
             * (start) -> (next.start) ... (next.end) -> (end)
             *      \------------->-------------------- /
             */

            start.edge(null, next.start);
            start.edge(null, end);
            next.end.edge(null, end);
            var toAppend = new recoil.util.regexp.NFA(start, end);
            /**
             * (cur.start) ... (cur.end) -> (next.start) ... (next.end)
             */
            cur = recoil.util.regexp.NFA.append(cur, next);
        }
    }
    return cur;

};
/**
 * @param {!recoil.util.regexp.NFA} x
 * @param {!recoil.util.regexp.NFA} y
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.NFA.append = function(x, y) {
    x.end.edge(null, y.start);
    return new recoil.util.regexp.NFA(x.start, y.end);
};

/**
 * @param {!recoil.util.regexp.NFA} x
 * @param {!recoil.util.regexp.NFA} y
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.NFA.or = function(x, y) {
    var start = new recoil.util.regexp.Node();
    var end = new recoil.util.regexp.Node();

    start.edge(null, x.start);
    start.edge(null, y.start);
    x.end.edge(null, end);
    y.end.edge(null, end);
    return new recoil.util.regexp.NFA(start, end);
};

/**
 * @param {?recoil.util.CharRange} chars
 * @param {!recoil.util.regexp.DFA.Closure} from
 */
recoil.util.regexp.NFA.closure = function (chars, from) {
    var seen = new WeakMap();
    var todo = from.nodes();
    // follow chars first since the start closure would of already
    // followed nulls
    var closure = [];
    
    if (chars) {
        while (todo.length > 0) {
            var cur = todo.shift();
            seen.set(cur, cur);
            cur.forEachEgedInCharset(charset, function (to) {                
                if (!seen.has(to)) {
                    seen.put(to, to);
                    todo.push(to);
                    closure.push(to);
                }
                if (charset.isBegin() || charset.isEnd()) {
                    to.followSeq_(charset, seen, todo, closure);
                }

            });
        }
    }
    // now follow the lamdas
    todo = closure.slice(0);
    while (todo.length > 0) {
        var cur = todo.shift();
        cur.forEachLamdaEged(function (to) {
            if (!seen.get(to)) {
                closure.push(to);
                todo.push(to);
            }
        });
    }
    return recoil.util.regexp.DFA.Closure(closure);
};
/**
 * @return {!recoil.util.regexp.DFA}
 */
recoil.util.regexp.NFA.prototype.toDFA = function() {
    var NFA = recoil.util.regexp.NFA;
    var DFA = recoil.util.regexp.DFA;
    var seen = new goog.struct.AvlTree(recoil.util.regexp.NFA.closureCompare);
    var start = NFA.closure(null, new DFA.Closure([this.start]));
    var todo = [start];
    var me = this;

    // make closures 
    while (todo.length > 0) {
        var cur = todo.shift();
        cur.forCharSet (function (charset) {
            var nextClosure = NFA.closure(charset, cur);
            var existing = seen.findFirst(nextClosure);
            if (existing) {
                nextClosure = existing;
            }
            else {
                todo.push(nextClosure);
                seen.add(nextClosure);
            }
            curNode.node.edge(charset, nextClosure.node);
        });
    }

    // anything that contains the end node is accepting
    seen.inOrderTraverse(function (n) {
        if (n.contains(me.end)) {
            n.node.accepting = true;
        }
    });

    return new recoil.util.regexp.DFA(start.node);
};


/**
 * @constructor
 * @param {recoil.util.regexp.Node} start
 */
recoil.util.regexp.DFA = function(start) {
    this.start = start;
};
/**
 * each node contains a set original match or submatches it belongs to
 * if it goes out of that match before accepting state then it is not added
 *
 * @return {?Object<number,{start:number, end:number}>}
 */
recoil.util.regexp.DFA.matchMap = function (str) {
    var matches = {};
    var pos = 0;
    var cur = this.follow('bos');
    var curMatches = {};
    
    while (cur && pos < str.length) {
        if (cur.accepting) {
            matches['?'] = {start:0,end:pos};
        }
        for (var match in curMatches) {
            if (!cur.match[match]) {
                delete curMatches[match];
            }
        }
        for (var match in cur.matches) {
            var matchInfo = cur.matches[match];
            if (matchInfo.start) {
                if (!curMatches[match]) {
                    curMatches[match] = pos;
                }
            }                
        }
        cur = this.follow(str[pos++]);
    }
    for (var k in matches) {
        return matches;
    };
    return null;
};
/**
 * @constructor
 * @param {!Array<recoil.util.regexp.Node>} nodes
 */
recoil.util.regexp.DFA.Closure = function (nodes) {
    // this is used in constuction of the dfa, it should
    // have no references to the nfa nodes the constructor
    // should strip them and just leave the meta data
    this.node = new recoil.util.regexp.Node(nodes);
    // TODO sort these somehow so we can store them in a avl tree
    this.nodes_ = nodes;
};

