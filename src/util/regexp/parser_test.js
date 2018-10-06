goog.provide('recoil.util.regexp.ParserTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.util.regexp.Parser');
goog.require('recoil.util.regexp.Scanner');

goog.setTestOnly('recoil.util.regexp.ParserTest');

var Parser = recoil.util.regexp.Parser;
var Scanner = recoil.util.regexp.Scanner;
function testParseRange() {
    function pr (input) {
        return new Parser(new Scanner(input)).parseRange_();
    }

    assertObjectEquals({start:1,end:10}, pr("{1,10}"));
    assertObjectEquals({start:7,end:7}, pr("{7}"));
    assertObjectEquals({start:2,end:0}, pr("{2,}"));
}


