goog.provide('recoil.structs.CacheTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.Cache');

goog.setTestOnly('recoil.structs.CacheTest');

function testGet() {
    var test = new recoil.structs.Cache(2, function (x, y) {
	if (x.v < y.v) {
	    return -1;
	}
	else if (x.v > y.v) {
	    return 1;
	}
	return 0;
    });
    var a = {v : "a"};
    var b = {v : "b"};
    var c = {v : "c"};
    test.put(a);
    test.put(b);
    assertTrue(a === test.get({v : "a"}));
    assertTrue(b === test.get({v : "b"}));
    test.put(c);
    assertTrue(b === test.get({v : "b"}));
    assertTrue(c === test.get({v : "c"}));
    assertFalse(a === test.get({v : "a"}));
}
