goog.provide('recoil.util.regexp.CharRangeTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.util.regexp.CharRange');
goog.require('recoil.util.object');
goog.setTestOnly('recoil.util.regexp.CharRangeTest');

var ns = recoil.util.regexp;
var NFA = recoil.util.regexp.NFA;


function testCharSet() {
    assertTrue("Not implemented yet", false);
}

function testTraverse() {
    assertTrue("Not implemented yet", false);
}

function testClone() {
    var n1 = new ns.Node();
    var n2 = new ns.Node();

    n1.edge(null, n2);
    var nfa = new ns.NFA(n1,n2);

    console.log("orig", nfa, "clone", nfa.clone());

    assertTrue("clone", recoil.util.object.isEqual(nfa, nfa.clone()));
}


