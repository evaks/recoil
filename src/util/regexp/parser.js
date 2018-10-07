goog.provide('recoil.util.regexp.Parser');

goog.require('recoil.util.regexp.CharRange');
goog.require('recoil.util.regexp.DFA');
goog.require('recoil.util.regexp.NFA');
goog.require('recoil.util.regexp.Scanner');

/**
 * @constructor
 * @param {!recoil.util.regexp.Scanner} scanner
 */
recoil.util.regexp.Parser = function(scanner) {
    this.scanner_ = scanner;
};

/**
 * @const
 * @private
 */
recoil.util.regexp.Parser.charTypes_ = (function() {
    var res = {};
    function setNot(idx, r) {
        res[idx] = r;
        res[idx + 1] = r.not();
    };
    var s = recoil.util.regexp.SymbolType;
    var cr = recoil.util.regexp.CharRange;
    res[s.dot] = cr.all();
    res[s.bos] = cr.start();
    res[s.eos] = cr.end();
    setNot(s.word, cr.ranges(['A', 'Z'], ['a', 'z'], ['0', '9'], '_'));
    setNot(s.digit, cr.ranges(['0', '9']));
    setNot(s.whitespace, cr.ranges(
        '\f', '\n', '\r', '\t', '\v', '\u00a0', '\u1680',
        ['\u2000', '\u200a'], '\u2028', '\u2029', '\u202f', '\u205f', '\u3000', '\ufeff'));

    // todo back reference \n maybe e.g (.)a\1 matches xax do this outside the dfa because it requires memory and probably not effient
    // [\b] is backspace

    // word boundry don't include prev in match
    // (^\w|\s\w)|(\w$|w\s)
    // (\w\w\w|\W\W\W)



    // res[s.control] = cr.end();
    return res;
})();

/**
 *
 * @param {string} input
 * @return {!recoil.util.regexp.DFA}
 */
recoil.util.regexp.Parser.prototype.parse = function(input) {
    this.scanner_ = new recoil.util.regexp.Scanner(input);
    return this.parseOr_().toDFA();
};

/**
 * @private
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.Parser.prototype.parseOr_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var NFA = recoil.util.regexp.NFA;
    var cur = this.parsePostOp_();
    var sym = this.scanner_.peek();
    while (sym.type != s.eof) {
        this.scanner_.scan(s.or);
        var right = this.parseConcat_();
        cur = NFA.or(cur, right);
    }
    return cur;
};
/**
 * @private
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.Parser.prototype.parsePostOp_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var NFA = recoil.util.regexp.NFA;

    var cur = this.parseConcat_();

    var sym = this.scanner_.peek();


    while (sym.type === s.plus || sym.type === s.star || sym.type === s.lbrace || sym.type === s.opt) {
        if (sym.type === s.plus || sym.type === s.star) {
            this.scanner_.scan(sym.type);
            cur = NFA.repeat(cur, sym.type === s.star ? 0 : 1, 0);
        }
        else if (sym.type === s.lbrace) {
            var range = this.parseRange_();
            cur = NFA.repeat(cur, range.start, range.end);
        }
        else if (sym.type === s.opt) {
            this.scanner_.scan(sym.type);
            cur = NFA.repeat(cur, 0, 1);
        }
    }
    return cur;

};

/**
 * @private
 * @return {!{start:!number,end:!number}}
 */
recoil.util.regexp.Parser.prototype.parseRange_ = function() {
    var s = recoil.util.regexp.SymbolType;
    this.scanner_.scan(s.lbrace);
    var sym = this.scanner_.peek();
    var start = 0;
    var end = 0;
    if (sym.type === s.number) {
        start = parseInt(sym.val, 10);
        end = start;
        sym = this.scanner_.next();
        if (sym.type === s.comma) {
            sym = this.scanner_.next();
            end = 0;
            if (sym.type === s.number) {
                end = parseInt(sym.val, 10);
                this.scanner_.next();
            }
        }
    }
    this.scanner_.scan(s.rbrace);
    return {start: start, end: end};
};

/**
 * @private
 * @return {!recoil.util.regexp.CharRange}
 */
recoil.util.regexp.Parser.prototype.parseCharRange_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var sym = this.scanner_.peek();
    var type = sym.type === s.not_char ? s.not_char : s.lsquare;
    this.scanner_.scan(type);
    sym = this.scanner_.peek();
    var charRanges = [];
    var inRange = false;
    var prev = null;
    while (sym.type != s.rbrace && s.eof !== sym.type) {
        if (sym.type === s.range) {
            if (inRange) {
                // todo prev must be <= next
                charRanges.push({start: prev, end: '-'});
                inRange = false;
                prev = null;
            }
            else if (prev !== null) {
                inRange = true;
            }
            else {
                prev = '-';
            }
        }
        else {
            var symVal = recoil.util.regexp.Parser.charTypes_[sym.type + ''];
            if (symVal) {
                // this is a range char can't be start or end of a range
                if (prev !== null) {
                    charRanges.push({start: prev, end: prev});
                }
                symVal.asList().forEach(function(item) {
                    charRanges.push(item);
                });
                prev = null;
                inRange = false;
            }
            else {
                if (inRange) {
                    if (prev !== null) {
                        charRanges.push({start: prev, end: sym.val});
                    }
                    prev = null;
                }
                else {
                    prev = sym.val;
                }
            }
        }


        sym = this.scanner_.next();
    }
    if (prev !== null) {
        charRanges.push({start: prev, end: prev});
    }

    for (var i = 0; i < charRanges.length; i++) {
        if (charRanges[i].start > charRanges[i].end) {
            throw 'Invalid range ' + charRanges[i].start + ' - ' + charRanges[i].end;
        }
    }
    return new recoil.util.regexp.CharRange(null, null, charRanges);

};
/**
 * @private
 * @return {!recoil.util.regexp.NFA}
 */
recoil.util.regexp.Parser.prototype.parseConcat_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var NFA = recoil.util.regexp.NFA;
    var sym = this.scanner_.peek();
    var charRanges = recoil.util.regexp.Parser.charTypes_[sym.type + ''];
    var cur = NFA.empty();
    while (charRanges || sym.type === s.lsquare || sym.type === s.not_char || sym.type === s.lbracket) {
        if (sym.type === s.lsquare || sym.type === s.not_char) {
            charRanges = this.parseCharRange_();
        }
        else if (sym.type === s.lbracket) {
            this.scanner_.next();
            cur = NFA.append(cur, this.parseOr_());
            this.scanner_.scan(s.rbracket);
        }
        if (charRanges) {
            cur = NFA.append(cur, charRanges);
        }

    }
    return cur;
};
