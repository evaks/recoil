goog.provide('recoil.util.regexp.ScannerTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.util.regexp.Scanner');

goog.setTestOnly('recoil.util.regexp.ScannerTest');
var ns = recoil.util.regexp;

function checkSequence(string, seq) {
    var s = new ns.Scanner(string);
    var sym = s.peek();
    var st = recoil.util.regexp.SymbolType;
    var pos = 0;
    while (st.eof !== sym.type) {
        var expected = seq[pos];
        if (expected === undefined) {
            assertTrue("too many symbols", false);
        }
        assertObjectEquals("symbol@" + pos + " expected " + seq[pos].val + " was " + sym.val+'.' + sym.type, expected, sym);
        pos++;
        sym = s.next();
    }
    assertTrue("missing symbols", pos == seq.length);
}

function testHex() {
    var st = recoil.util.regexp.SymbolType;
    checkSequence("\\xaa", [{type: st.char, val:'\xaa'}]);
}

function testUnicode() {
    var st = recoil.util.regexp.SymbolType;
    checkSequence("\\uaaaa\\uaaaaaa\\uaaaaaz", [{type: st.char, val:'\uaaaa'},{type: st.char, val:'\uaaaa'},{type: st.char, val:'a'}, {type: st.char, val:'a'}, {type: st.char, val:'\uaaaa'},{type: st.char, val:'a'},{type: st.char, val:'z'}]);
}

function testOctal() {
    var st = recoil.util.regexp.SymbolType;
    checkSequence("\\1234\\0", [{type: st.char, val:'\123'},{type: st.char, val:'4'},{type: st.char, val:'\0'}]);
}

function testRegexp() {
    var st = recoil.util.regexp.SymbolType;
    checkSequence("abc", [{type: st.char, val:'a'},{type: st.char, val:'b'},{type: st.char, val:'c'}]);
    checkSequence("|.*+?,{}[][^]()^$\\w\\W\\s\\S\\d\\D", [
        {type: st.or, val:'|'},
        {type: st.dot, val:'.'},
        {type: st.star, val:'*'},
        {type: st.plus, val:'+'},
        {type: st.opt, val:'?'},
        {type: st.char, val:','},
        {type: st.lbrace, val:'{'},
        {type: st.rbrace, val:'}'},
        {type: st.lsquare, val:'['},
        {type: st.rsquare, val:']'},
        {type: st.not_char, val:'[^'},
        {type: st.rsquare, val:']'}, // 10
        {type: st.lbracket, val:'('},
        {type: st.rbracket, val:')'},
        {type: st.bos, val:'^'},
        {type: st.eos, val:'$'},
        {type: st.word, val:'\\w'},
        {type: st.non_word, val:'\\W'},
        {type: st.whitespace, val:'\\s'},
        {type: st.non_whitespace, val:'\\S'},
        {type: st.digit, val:'\\d'},
        {type: st.non_digit, val:'\\D'},
    ]);
    checkSequence("}}}{11}",[
        {type: st.char, val:'}'},
        {type: st.char, val:'}'},
        {type: st.char, val:'}'},
        {type: st.lbrace, val:'{'},
        {type: st.number, val:'11'},
        {type: st.rbrace, val:'}'},
        
    ]);
    checkSequence("]]][[]",[
        {type: st.char, val:']'},
        {type: st.char, val:']'},        
        {type: st.char, val:']'},
        {type: st.lsquare, val:'['},
        {type: st.char, val:'['},
        {type: st.rsquare, val:']'}]);
    // ]]]]
    // 
}


