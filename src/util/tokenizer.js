goog.provide('recoil.util.ExpParser');
goog.provide('recoil.util.Tokenizer');

/**
 * @constructor
 */
recoil.util.Tokenizer = function() {
    var syms = '()*+-,/^';
    this.basic_ = {};
    this.regs_ = [{reg: /^\d+(\.\d+)?/, type: 'num'},
                  {reg: /^[a-z_A-Z][a-zA-Z_0-9]*/, type: 'ident'}];
    this.whitespace_ = /^\s/;

    for (var i = 0; i < syms.length; i++) {
        this.basic_[syms[i]] = true;
    }

};


/**
 * @param {string} val
 * @return {Array<Object>}
 */
recoil.util.Tokenizer.prototype.tokenize = function(val) {

    var res = [];
    var num = '';

    for (var i = 0; i < val.length; ) {
        var ch = val[i];

        if (this.basic_[ch]) {
            res.push({'type': ch});
            i++;
        } else {
            var remaining = val.substring(i);
            var whiteSpaceMatch = this.whitespace_.exec(remaining);
            if (whiteSpaceMatch && whiteSpaceMatch[0].length > 0) {
                i += whiteSpaceMatch[0].length;
            } else {
                var matchFound = false;
                for (var j = 0; j < this.regs_.length; j++) {
                    var expr = this.regs_[j].reg;

                    var match = expr.exec(remaining);
                    if (match && match[0].length > 0) {
                        matchFound = true;
                        res.push({type: this.regs_[j].type, value: match[0]});
                        i += match[0].length;
                        break;
                    }
                }
                if (!matchFound) {
                    i++;
                    return null;
                }
            }
        }


    }
    return res;
};

/**
 * @constructor
 *
 */
recoil.util.ExpParser = function() {
    this.tokenizer_ = new recoil.util.Tokenizer();
    var ns = recoil.util.ExpParser;


    var parsers = [];
    var functions = {'ceil': {func: Math.ceil, min: 1}, 'floor': {func: Math.floor, min: 1}};
    parsers.push(ns.parseBinary_(parsers, '+', function(x, y) {return x + y;}));
    parsers.push(ns.parseBinary_(parsers, '-', function(x, y) {return x - y;}));
    parsers.push(ns.parseUnary_(parsers, {'+': function(x) {return x;},
                                          '-': function(x) {return -x;}}));
    parsers.push(ns.parseBinary_(parsers, '*', function(x, y) {return x * y;}));
    parsers.push(ns.parseBinary_(parsers, '/', function(x, y) {return x / y;}));
    parsers.push(ns.parseBinary_(parsers, '^', function(x, y) {return Math.pow(x, y);}));
    parsers.push(ns.parseFunction_(parsers, functions));
    parsers.push(ns.parseBracket_(parsers));
    parsers.push(ns.parseNumber_(parsers));
    this.parsers_ = parsers;
};

/**
 * @typedef {{ type:string, value:(undefined|string)}}
 */
recoil.util.Tokenizer.Info;

/**
 * @param {string} exp
 * @return {?number}
 */
 recoil.util.ExpParser.prototype.eval = function(exp) {
    var tokens = this.tokenizer_.tokenize(exp);
    var pos = {v: 0};
    var res = this.parsers_[0](0, pos, tokens);

    if (pos.v !== tokens.length) {
        return null;
    }

    return res;
};

/**
  * @param {!Array<function(number, {v:number}, !Array<!recoil.util.Tokenizer.Info>)>} parsers list of parsers in reverse precidence order
 * @private
 * @return {function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number}
 */
recoil.util.ExpParser.parseBracket_ = function(parsers) {
    /**
     * @param {number} level the current position in the parsers array
     * @param {{v:number}} pos the position in the tokens array
     * @param {!Array<recoil.util.Tokenizer.Info>} tokens
     * @return {?number}
     */
    var res = function(level, pos, tokens) {
        var cur = tokens[pos.v];
        if (!cur) {
            return null;
        }
        if (cur.type === '(') {
            pos.v++;
            var res = parsers[0](0, pos, tokens);
            cur = tokens[pos.v];
            if (!cur || cur.type !== ')') {
                return null;
            }
            pos.v++;
            return res;
        }
        return parsers[level + 1](level + 1, pos, tokens);
    };
    return res;
};

/**
  * @param {!Array<function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number>} parsers list of parsers in reverse precidence order
 * @private
 * @return {function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number}
 */
recoil.util.ExpParser.parseNumber_ = function(parsers) {
    /**
     * @param {number} level the current position in the parsers array
     * @param {{v:number}} pos the position in the tokens array
     * @param {!Array<recoil.util.Tokenizer.Info>} tokens
     * @return {?number}
     */
    var res = function(level, pos, tokens) {
        var cur = tokens[pos.v];
        if (!cur || cur.type !== 'num') {
            return null;
        }
        pos.v++;
        return parseFloat(cur.value);
    };
    return res;
};

/**
 * @param {!Array<function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>)>} parsers list of parsers in reverse precidence order
 * @param {string} op
 * @param {function(number, number, number=)} func
 * @private
 * @return {function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number}
 */
recoil.util.ExpParser.parseBinary_ = function(parsers, op, func) {
    /**
     * @param {number} level the current position in the parsers array
     * @param {{v:number}} pos the position in the tokens array
     * @param {!Array<recoil.util.Tokenizer.Info>} tokens
     * @return {?number}
     */
    var res = function(level, pos, tokens) {
        var val = parsers[level + 1](level + 1, pos, tokens);

        if (val === null) {
            return null;
        }
        var cur = tokens[pos.v];
        while (cur && cur.type === op) {
            pos.v++;
            var next = parsers[level + 1](level + 1, pos, tokens);
            if (next === null) {
                return null;
            }
            val = func(val, next);
            cur = tokens[pos.v];
        }
        return val;
    };
    return res;
};

/**
 * @param {!Array<function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>)>} parsers list of parsers in reverse precidence order
 * @param {Object<string,{func:function(...):number, min:number, max:(undefined|number)}>} funcs a map of functions that we support
 * @private
 * @return {function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number}
 */
recoil.util.ExpParser.parseUnary_ = function(parsers, funcs) {
    /**
     * @param {number} level the current position in the parsers array
     * @param {{v:number}} pos the position in the tokens array
     * @param {!Array<recoil.util.Tokenizer.Info>} tokens
     * @return {?number}
     */
    var res = function(level, pos, tokens) {

        var cur = tokens[pos.v];

        var ops = [];
        while (cur && funcs[cur.type]) {
            ops.push(funcs[cur.type]);
            pos.v++;
            cur = tokens[pos.v];
        }
        var val = parsers[level + 1](level + 1, pos, tokens);
        if (val === null) {
            return null;
        }

        for (var i = ops.length - 1; i >= 0; i--) {
            val = ops[i](val);
        }

        return val;
    };
    return res;
};

/**
 * @param {!Array<function(number,{v:number}, !Array<recoil.util.Tokenizer.Info>)>} parsers list of parsers in reverse precidence order
 * @param {Object<string,{func:function(...):number, min:number, max:(undefined|number)}>} funcs a map of functions that we support
 * @private
 * @return {function(number, {v:number}, !Array<recoil.util.Tokenizer.Info>):?number}
 */
recoil.util.ExpParser.parseFunction_ = function(parsers, funcs) {
    /**
     * @param {number} level the current position in the parsers array
     * @param {{v:number}} pos the position in the tokens array
     * @param {!Array<recoil.util.Tokenizer.Info>} tokens
     * @return {?number}
     */
    var res = function(level, pos, tokens) {

        if (tokens[pos.v].type === 'ident') {
            var funcInfo = funcs[tokens[pos.v].value || ''];

            if (funcInfo) {
                pos.v++;
                if (tokens[pos.v].type !== '(') {
                    return null;
                }

                pos.v++;
                var vals = [];
                var i = 0;
                while (i < funcInfo.min) {
                    vals.push(parsers[0](0, pos, tokens));
                    i++;
                    if (i < funcInfo.min) {
                        if (tokens[pos.v].type !== ',') {
                            return null;
                        }
                        pos.v++;
                    }
                }

                while (funcInfo.max && i < funcInfo.max && tokens[pos.v].type !== ',') {
                    pos.v++;
                    vals.push(parsers[0](0, pos, tokens));
                }

                if (tokens[pos.v].type !== ')') {
                    return null;
                }
                pos.v++;
                return funcInfo.func.apply(null, vals);
            } else {
                return null;
            }
        }
        else {
            return parsers[level + 1](level + 1, pos, tokens);
        }
    };
    return res;
};

/**
 * @final
 * @type {!recoil.util.ExpParser}
 */
recoil.util.ExpParser.instance = new recoil.util.ExpParser();
