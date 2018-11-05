goog.provide('recoil.util.regexp.CharRange');
goog.provide('recoil.util.regexp.DFA');
goog.provide('recoil.util.regexp.EdgeSet');
goog.provide('recoil.util.regexp.NFA');



goog.require('goog.array');
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
 * @return {!boolean}
 */
recoil.util.regexp.CharRange.prototype.isStart = function() {
    return !!this.start_;
};

/**
 * @return {!boolean}
 */
recoil.util.regexp.CharRange.prototype.isEnd = function() {
    return !!this.end_;
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
 * this function can only be called on dfa nodes it assumes 1 char leads to 0 or 1 nodes
 * @param {string} char
 * @return {?recoil.util.regexp.Node}
 */
recoil.util.regexp.EdgeSet.prototype.follow = function(char) {};

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
 * this function can only be called on dfa nodes it assumes 1 char leads to 0 or 1 nodes
 * @param {string} char
 * @return {?recoil.util.regexp.Node}
 */
recoil.util.regexp.GenericEdgeSet.prototype.follow = function(char) {
    throw "you haven't converted to a dfa yet";
};

/**
 * @implements {recoil.util.regexp.EdgeSet}
 * @constructor
 */
recoil.util.regexp.DFAEdgeSet = function() {
    this.eos_ = null;
    this.bos_ = null;
    this.chars_ = [];
};

/**
 * @param {?recoil.util.regexp.CharRange} charSet
 * @param {!recoil.util.regexp.Node} node
 */
recoil.util.regexp.DFAEdgeSet.prototype.addEdge = function(charSet, node) {
    if (charSet.isStart()) {
        if (this.bos_ && this.bos_ !== node) {
            throw 'non-deterministic start state';
        }
        this.bos_ = node;
    }
    if (charSet.isEnd()) {
        if (this.eos_ && this.eos_ !== node) {
            throw 'non-deterministic end state';
        }
        this.eos_ = node;
    }

    charSet.getRanges().forEach(function(range) {
        this.edges_.push({node: node, start: range.start, end: range.end});
    });
};

/**
 * optimizes the edgeset by sorting the nodes
 * and replacing itself if nessary a map or all edget it also
 * performs check to see if the edgeset is deterministic
 * @return {recoil.util.regexp.EdgeSet}
 */
recoil.util.regexp.DFAEdgeSet.prototype.finish = function() {
    var charCount = 0;
    charCount += this.eos_ ? 1 : 0;
    charCount += this.bos_ ? 1 : 0;

    var prev = null;
    var newEdges = [];
    this.edges_.sort(recoil.util.regexp.CharRange.compare_);
    this.edges_.forEach(function(edge) {
        if (prev) {
            if (prev.end < edge.start) {
                newEdges.push(prev);
            }
            else if (prev.node === edge.node) {
                prev.end = edge.end;
            }
            else {
                throw 'non-deterministic node found';
            }
        }
        else {
            prev = edge;
        }
    });

    if (prev) {
        newEdges.push(prev);
    }
    this.edges_ = newEdges;
    return this;
};

/**
 * @private
 * @param {string} target
 * @param {!{start:string, end:string}} range
 * @return {number}
 */
recoil.util.regexp.DFAEdgeSet.findCompare_ = function(target, range) {
    if (target < range.start) {
        return -1;
    }
    else if (target > range.end) {
        return 1;
    }
    return 0;
};
/**
 * this function can only be called on dfa nodes it assumes 1 char leads to 0 or 1 nodes
 * @param {string} char
 * @return {?recoil.util.regexp.Node}
 */
recoil.util.regexp.DFAEdgeSet.prototype.follow = function(char) {

    if (char === 'eos') {
        return this.eos_;
    }
    if (char === 'bos') {
        return this.bos_;
    }
    var idx = goog.array.binarySearch(this.edges_, char, recoil.util.regexp.findCompare_);
    if (idx >= 0) {
        return this.edges_[idx].node;
    }
    return null;
};


/**
 * @param {function(?recoil.util.regexp.CharRange,!recoil.util.regexp.Node)} callback
 */
recoil.util.regexp.DFAEdgeSet.prototype.forEachEdge = function(callback) {
    if (this.eos_) {
        callback(new recoil.util.regexp.CharRange(true, null, []), this.eos_);
    }
    if (this.bos_) {
        callback(new recoil.util.regexp.CharRange(null, true), this.eos_);
    }

    this.edges_.forEach(function(e) {
        callback(new recoil.util.regexp.CharRange(null, null, [{start: e.start, end: e.end}]));
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
 * this function can only be called on dfa nodes it assumes 1 char leads to 0 or 1 nodes
 * @param {string} char
 * @return {?recoil.util.regexp.Node}
 */
recoil.util.regexp.Node.prototype.follow = function(char) {
    return this.edges_.follow(char);
};
/**
 * @interface
 */
recoil.util.regexp.FA = function() {};


/**
 * no recursion here we have no idea how big this is
 * @param {!recoil.util.regexp.Node} node
 * @param {!function(!recoil.util.regexp.Node)} cb
 * @param {boolean=} opt_skipFirst should we do the callback on the first node
 * @param {function(!recoil.util.regexp.Node):boolean=} opt_edgeCheck
 */
recoil.util.regexp.Node.traverse = function(node, cb, opt_skipFirst, opt_edgeCheck) {
    var todo = [node];
    var seen = new WeakMap();
    var first = true;
    var edgeCheck = opt_edgeCheck || function() {return true;};
    if (!opt_skipFirst) {
        seen.set(node, node);
    }
    while (todo.length > 0) {
        var cur = todo.shift();
        if (!first || !opt_skipFirst) {
            cb(cur);
        }
        first = false;
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
 * @private
 * @param {?recoil.util.regexp.CharRange} charset
 * @param {!recoil.util.regexp.DFA.Closure} from
 * @return {recoil.util.regexp.DFA.Closure}
 */
recoil.util.regexp.NFA.closure_ = function(charset, from) {
    var seen = new WeakMap();
    var todo = from.nodes();
    // follow chars first since the start closure would of already
    // followed nulls
    var closure = [];

    if (charset) {
        while (todo.length > 0) {
            var cur = todo.shift();
            seen.set(cur, cur);
            cur.forEachEdgeInCharset(charset, function(to) {
                if (!seen.has(to)) {
                    seen.set(to, to);
                    todo.push(to);
                    closure.push(to);
                }
                if (charset.isStart() || charset.isEnd()) {
                    to.followSeq_(charset, seen, todo, closure);
                }

            });
        }
    }
    // now follow the lamdas
    todo = closure.slice(0);
    while (todo.length > 0) {
        var cur = todo.shift();
        cur.forEachLamdaEdge(function(to) {
            if (!seen.get(to)) {
                closure.push(to);
                todo.push(to);
            }
        });
    }
    return new recoil.util.regexp.DFA.Closure(closure);
};

/**
 * @return {!recoil.util.regexp.DFA}
 */
recoil.util.regexp.NFA.prototype.toDFA = function() {
    var NFA = recoil.util.regexp.NFA;
    var DFA = recoil.util.regexp.DFA;
    var seen = {};
    var me = this;
    var nodeIds = new WeakMap();
    var curId = 0;
    recoil.util.regexp.Node.traverse(this.start, function(node) {
        nodeIds.set(node, curId++);
    });
    var start = NFA.closure_(null, new DFA.Closure([this.start], nodeIds));
    var todo = [start];
    // make closures
    while (todo.length > 0) {
        var cur = todo.shift();
        cur.forEachUniqueCharSet(function(charset) {
            var nextClosure = NFA.closure_(charset, cur);
            var existing = seen[nextClosure.id()];
            if (existing) {
                nextClosure = existing;
            }
            else {
                todo.push(nextClosure);
                seen.add(nextClosure);
            }
            cur.node.edge(charset, nextClosure.node);
        });
    }

    // anything that contains the end node is accepting
    for (var k in seen) {
        var n = seen[k];
        if (n.contains(me.end)) {
            n.node.accepting = true;
        }
    }

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
 * @param {string} str
 * @return {?Object<number,{start:number, end:number}>}
 */
recoil.util.regexp.DFA.prototype.matchMap = function(str) {
    var matches = {};
    var pos = 0;
    var cur = this.start.follow('bos');
    var curMatches = {};

    while (cur && pos < str.length) {
        if (cur.accepting) {
            matches['?'] = {start: 0, end: pos};
        }
        for (var match in curMatches) {
            if (!cur.match[match]) {
                delete curMatches[match];
            }
        }
        for (match in cur.matches) {
            var matchInfo = cur.matches[match];
            if (matchInfo.start) {
                if (!curMatches[match]) {
                    curMatches[match] = pos;
                }
            }
        }
        cur = cur.follow(str[pos++]);
    }

    if (cur) {
        cur = cur.follow('eos');
    }
    for (var k in matches) {
        return matches;
    }
    return null;
};
/**
 * @constructor
 * @param {!Array<!recoil.util.regexp.Node>} nodes
 * @param {WeakMap} idMap
 */
recoil.util.regexp.DFA.Closure = function(nodes, idMap) {
    // this is used in constuction of the dfa, it should
    // have no references to the nfa nodes the constructor
    // should strip them and just leave the meta data
    this.node = new recoil.util.regexp.Node(nodes);
    this.nodes_ = nodes;
    var ids = [];
    nodes.forEach(function(n) {
        ids.push(idMap.get(n));
    });
    ids.sort(); // don't care what sort order just as long as it is consitent
    this.id_ = ids.join('_');
};

/**
 * @return {string}
 */
recoil.util.regexp.DFA.Closure.prototype.id = function() {
    return this.id_;
};

/**
 * follows lamba edges for each node in this closure and
 * and calls the callback to indicate the nodes it can reach
 * @param {function(!recoil.util.regexp.Node)} cb
 */
recoil.util.regexp.DFA.Closure.prototype.forEachLamdaEdge = function(cb) {
    var seen = new WeakMap();
    var doCb = function(node) {
        if (!seen.get(node)) {
            cb(node);
        }
    };
    var onlyLamba = function(e) {
        return e === null;
    };
    this.nodes_.forEach(function(node) {
        recoil.util.regexp.Node.traverse(node, doCb, true, onlyLamba);
    });
};

/**
 * @param {!Array<!{start:number,end:number}>} charset
 * @param {function(!recoil.util.regexp.Node)} cb
 */
recoil.util.regexp.DFA.Closure.prototype.forEachEdgeInCharset = function(charset, cb) {
    var seen = new WeakMap();
    var me = this;
    charset.forEach(function (range) {
        me.edges_.getDestNodes(charset).forEach(function (n) {
            if (!seen.get(n)) {
                cb(n);
            }
        });
    });
};

// write test for this it is complex

recoil.util.regexp.DFA.Closure.prototype.forEachUniqueCharSet = function () {
    // get all ranges
    var allRanges = [];
    // sort
    allRanges.sort(recoil.util.regexp.CharRange.compare_);
    if (allRanges.length === 0) {
        return;
    }
    // get rid of overlaps
    var res = [];
    var pushifnotempty = function (r) {
        if (r.start <= r.end) {
            res.push(r);
        }
    };
    var addCh = function (c, amount) {
        return String.fromCharCode(c.charCodeAt(0) + amount);
    };
    var workingRange = {start: allRanges[0].start, end: allRanges[0].end};
    var workingStart = workingRange.start;
    
    for (var i = 1; i < allRanges.length; i++) {
        var cur = allRanges[i];

        if (workingRange.end < cur.start) {
            
            res.push({start: workingRange.start, end: workingRange.end});
        }
        else if (workingRange.start === cur.start) {
            if (workingRange.end === cur.end) {
                continue;
            }
            else if (cur.end < workingRange.end) {
                pushifnotempty({start:workingStart, end: cur.end});
                workingStart = addCh(cur.end, 1);
            }
            else {
                pushifnotempty({start:workingStart, end: workingRange.end});
                workingStart = addCh(workingRange.end, 1);
            }
        }
        else if (workingRange.start < cur.start) {
            if (workingRange.end < cur.start) {
                pushifnotempty({start:workingStart, end: workingRange.end});
            }
            else { 
                pushifnotempty({start:workingStart, end: addCh(curStart, -1)});
            }
            workingStart = cur.start;
        }
        else { // workingStart.start > cur.start
            throw "unexpected state start must be <= nextstart";
        }
        workingRange.start = cur.start;
        workingRange.end = Math.max(workingRange.end, cur.end);
    };

    pushifnotempty({start:workingStart, end:workingRange.end});
    
};
