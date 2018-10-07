goog.provide('recoil.util.regexp.Scanner');



/**
 *
 * @enum {number}
 */
recoil.util.regexp.SymbolType = {
    lbracket: 1,
    rbracket: 2,
    lbrace: 3,
    rbrace: 4,
    lsquare: 5,
    rsquare: 6,
    star: 7,
    plus: 8,
    dot: 9,
    bos: 10,
    eos: 11,
    word: 12,
    non_word: 13, // must be 1 more
    digit: 14,
    non_digit: 15, // must be 1 more than digit
    whitespace: 16,
    non_whitespace: 17, // must be 1 more than whitespace
    word_start_end: 18,
    non_word_start_end: 19, // must be one more
    //newline
    //form feed \f
    //carrage return
    // \xxx octal
    // \xddd
    // \uxxxx

    opt: 20,
    comma: 21,
    char: 22,
    range: 23,
    not_char: 24,
    number: 25,
    or: 26,
    eof: 27 // end of regexp
    // not sure about ?= and != don't quite see the point I seen the point of not regualar expression
    // we will see if we can implement that but this seems like a source of bugs if someone =? expecting to get maybe equals
};

/**
 * @typedef {{val:string,type:recoil.util.regexp.SymbolType}}
 */
recoil.util.regexp.Symbol;

/**
 * @param {string} input this should change to be a stream of some kind
 * @constructor
 */
recoil.util.regexp.Scanner = function(input) {
    this.pos_ = 0;
    this.inRange_ = false;
    this.input_ = input;
    this.inRepeat_ = 0;
    /**
     * @type {!recoil.util.regexp.Symbol}
     * @private
     */
    this.sym_ = this.next_();
};

/**
 * @const
 */
recoil.util.regexp.Scanner.SymbolMap = {
    '(': recoil.util.regexp.SymbolType.lbracket,
    ')': recoil.util.regexp.SymbolType.rbracket,
    '*': recoil.util.regexp.SymbolType.star,
    '+': recoil.util.regexp.SymbolType.plus,
    '|': recoil.util.regexp.SymbolType.or,
    '.': recoil.util.regexp.SymbolType.dot,
    '?': recoil.util.regexp.SymbolType.opt,
    '^': recoil.util.regexp.SymbolType.bos,
    '$': recoil.util.regexp.SymbolType.eos
};

/**
 * @const
 */

recoil.util.regexp.Scanner.CharSetMap = {
    'd': recoil.util.regexp.SymbolType.digit,
    'w': recoil.util.regexp.SymbolType.word,
    's': recoil.util.regexp.SymbolType.whitespace
};



/**
 * @return {!recoil.util.regexp.Symbol}
 */
recoil.util.regexp.Scanner.prototype.peek = function() {
    return this.sym_;
};

/**
 * @return {!recoil.util.regexp.Symbol}
 */
recoil.util.regexp.Scanner.prototype.next = function() {
    this.sym_ = this.next_();
    return this.sym_;
};

/**
 * @return {string}
 */
recoil.util.regexp.Scanner.prototype.getErrorPoint = function() {
    // not quite right but it will do we really need to store where the current symbol started
    // or maybe subtract the input length
    return this.input_.substring(0, this.pos_);
};
/**
 * advance scanner an throws an error if the symboltype currently doesn't match
 * @param {recoil.util.regexp.SymbolType} type
 */
recoil.util.regexp.Scanner.prototype.scan = function(type) {
    if (this.sym_.type !== type) {
        throw 'Unexpected symbol at ' + this.getErrorPoint();
    }
    this.next();
};
/**
 * @private
 * @return {!recoil.util.regexp.Symbol}
 */
recoil.util.regexp.Scanner.prototype.next_ = function() {
    var s = recoil.util.regexp.SymbolType;
    if (this.pos_ >= this.input_.length) {
        return {type: s.eof, val: ''};
    }
    var ch = this.input_[this.pos_++];
    var input = ch;
    var sym = recoil.util.regexp.Scanner.SymbolMap[ch];

    if (sym !== undefined && !this.inRange_) {
        return {type: sym, val: ch};
    }
    if (this.inRepeat_ && ch === '-') {
        return {type: s.range, val: '-'};
    }

    if (this.inRepeat_) {
        var num = ch;
        if (ch <= '9' && ch >= '0') {
            var peek = this.input_[this.pos_];
            while (peek && peek <= '9' && peek >= '0') {
                num += peek;
                this.pos_++;
                peek = this.input_[this.pos_];
            }
            return {type: s.number, val: num};
        }
        if (ch === ',') {
            return {type: s.comma, val: num};
        }
    }

    switch (ch) {
    case '\\':
        return this.nextEscape_(input);
    case '{':
        this.inRepeat_++;
        return {type: s.lbrace, val: '{'};
    case '}':
        if (this.inRepeat_) {
            this.inRepeat_--;
            return {type: s.rbrace, val: '}'};
        }
        return {type: s.char, val: '}'};
    case ']':
        if (this.inRange_) {
            this.inRange_ = false;
            return {type: s.rsquare, val: ch};
        }
        return {type: s.char, val: ch};

    case '[':
        if (this.inRange_) {
            return {type: s.char, val: '['};
        }
        this.inRange_ = true;
        var next = this.input_[this.pos_];
        if (next === undefined) {
            throw 'Invalid expression';
        }
        if (next === '^') {
            this.pos_++;
            return {type: s.not_char, val: '[^'};
        }
        return {type: s.lsquare, val: ch};
    default:
        return {type: s.char, val: ch};
    }
};

/**
 * @return {!recoil.util.regexp.Symbol}
 * @private
 */
recoil.util.regexp.Scanner.prototype.nextHex_ = function() {
    var s = recoil.util.regexp.SymbolType;
    if (this.pos_ + 1 < this.input_.length) {
        var d1 = this.input_[this.pos_];
        var d2 = this.input_[this.pos_ + 1];
        if (/[a-fA-F0-9]/.test(d1) && /[a-fA-F0-9]/.test(d2)) {
            this.pos_ += 2;

            return {type: s.char, val: String.fromCharCode(parseInt(d1 + d2, 16))};
        }
    }
    throw 'Unexpected Symbol ' + this.getErrorPoint();
};

/**
 * 4 or 6 unicode chars
 * @return {!recoil.util.regexp.Symbol}
 * @private
 */
recoil.util.regexp.Scanner.prototype.nextUnicode_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var offset = 0;
    var val = '';
    var nextPart = '';
    while (this.pos_ + offset < this.input_.length && offset < 4 && /[a-fA-F0-9]/.test(this.input_[this.pos_ + offset])) {
        val += this.input_[offset + this.pos_];
        offset++;
    }
    if (offset !== 4) {
        throw 'Unexpected Symbol ' + this.getErrorPoint();
    }
    /*
      while (this.pos_ + offset < this.input_.length && offset < 6 && /[a-fA-F0-9]/.test(this.input_[this.pos_ + offset])) {
      nextPart += this.input_[offset + this.pos_];
      offset++;
      }
      if (offset === 6) {
      val += nextPart;
      }
      else {
      offset = 4;
      }*/
    this.pos_ += offset;
    return {type: s.char, val: String.fromCharCode(parseInt(val, 16))};

};

/**
 * 3 octal
 * @return {!recoil.util.regexp.Symbol}
 * @private
 */
recoil.util.regexp.Scanner.prototype.nextOctal_ = function() {
    var s = recoil.util.regexp.SymbolType;
    var offset = 0;
    var val = '';
    var nextPart = '';
    while (this.pos_ + offset < this.input_.length && offset < 3 && /[0-7]/.test(this.input_[this.pos_ + offset])) {
        val += this.input_[offset + this.pos_];
        offset++;
    }
    if (offset == 1 && val === '0') {
        this.pos_++;
        return {type: s.char, val: '\0'};
    }
    if (offset !== 3) {
        throw 'Unexpected Symbol ' + this.getErrorPoint();
    }
    this.pos_ += offset;
    return {type: s.char, val: String.fromCharCode(parseInt(val, 8))};

};


/**
 * @param {string} input
 * @return {!recoil.util.regexp.Symbol}
 * @private
 */
recoil.util.regexp.Scanner.prototype.nextEscape_ = function(input) {
    var s = recoil.util.regexp.SymbolType;

    var next = this.input_[this.pos_++];
    input += next;
    var type = recoil.util.regexp.Scanner.CharSetMap[next];
    if (type === undefined) {
        type = recoil.util.regexp.Scanner.CharSetMap[next.toLowerCase()];
        if (type !== undefined) {
            type++;
        }
    }

    if (type !== undefined) {
        return {type: type, val: input};
    }

    if (!this.inRange_) {
        switch (next) {
        case 'b':
            return {type: s.word_start_end, val: input};
        case 'B':
            return {type: s.non_word_start_end, val: input};
        }
    }
    switch (next) {
    case 'n':
        return {type: s.char, val: '\n'};
    case 'f':
        return {type: s.char, val: '\f'};
    case 'r':
        return {type: s.char, val: '\r'};
    case 't':
        return {type: s.char, val: '\t'};
    case 'v':
        return {type: s.char, val: '\v'};
    case 'x':
        return this.nextHex_();
    case 'u':
        return this.nextUnicode_();

    default:
        // \0 null char
        if (next >= '0' && next <= '7') {
            this.pos_--;
            return this.nextOctal_();
        }
        return {type: s.char, val: next};
    }

};

