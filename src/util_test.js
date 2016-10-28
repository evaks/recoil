goog.provide('recoil.util.UtilTest');

goog.require('recoil.util');
goog.require('goog.testing.jsunit');

goog.setTestOnly('recoil.util.UtilTest');

function testIsEqual() {
    var overrideEquals = {
        equals: function (a, b) {
            return true;
        }

    };

    function Override() {

    }

    Override.prototype.equals = function (a, b) {
        return true;
    };
    var loopTestA = {
        v:    'a',
        some: {}
    };
    var loopTestB = {
        v:    'a',
        some: {}
    };

    loopTestA.some.me = loopTestA;
    loopTestB.some.me = loopTestB;

    assertTrue('loop eq', recoil.util.isEqual(loopTestA, loopTestB));

    loopTestB.some.me = loopTestA;
    assertFalse('loop neq', recoil.util.isEqual(loopTestA, loopTestB));

    assertTrue('override left', recoil.util.isEqual(overrideEquals, [1, 2, 3]));
    assertTrue('override left', recoil.util.isEqual(new Override(), [1, 2, 3]));
    assertTrue('override right', recoil.util.isEqual([1, 2, 3], overrideEquals));
    assertTrue('array eq', recoil.util.isEqual([1, 2, 3], [1, 2, 3]));
    assertFalse(recoil.util.isEqual([1, 2, 3], [1, 2, 4]));
    assertFalse(recoil.util.isEqual([1, 2, 3], [1, 2, 3, 4]));
    assertFalse(recoil.util.isEqual([1, 2, 3, 4], [1, 2, 3]));
    assertTrue(recoil.util.isEqual([1, 2, 3], [1, 2, 3]));
    assertTrue(recoil.util.isEqual(1, 1));

    assertTrue(recoil.util.isEqual({
        foo: 'a'
    }, {
        foo: 'a'
    }));
    assertFalse(recoil.util.isEqual({
        foo: 'a'
    }, {
        foo: 'a',
        b1:  'a'
    }));
    assertFalse(recoil.util.isEqual({
        foo: 'b'
    }, {
        foo: 'a'
    }));
    assertFalse(recoil.util.isEqual(3, 2));
    assertFalse(recoil.util.isEqual(undefined, 2));
    assertFalse(recoil.util.isEqual(2, undefined));

    assertFalse(recoil.util.isEqual(null, 2));
    assertFalse(recoil.util.isEqual(2, null));

    assertTrue(recoil.util.isEqual(goog.math.Long.fromInt(1), goog.math.Long
          .fromInt(1)));
    assertFalse(recoil.util.isEqual(goog.math.Long.fromInt(2), goog.math.Long
          .fromInt(1)));

}

function semetricCompare(a, b, expected) {

    if (expected < 0) {
        assertTrue(recoil.util.compare(a, b) < 0);
        assertTrue(recoil.util.compare(b, a) > 0);

    }
    else {
        assertEquals(0, recoil.util.compare(a, b));
        assertEquals(0, recoil.util.compare(b, a));
    }
}
function testCompare() {
    assertEquals(recoil.util.compare('a', 'a'), 0);
    semetricCompare(recoil.util.compare('a', 'b'), -1);

    assertEquals(recoil.util.compare([1, 2, 3], [1, 2, 3]), 0);
    semetricCompare([1, 2, 3], [1, 2, 3, 4], -1);

    assertEquals(recoil.util.compare(1, 1), 0);
    semetricCompare(1, 2, -1);

    assertEquals(recoil.util.compare({
        foo: 'a'
    }, {
        foo: 'a'
    }), 0);

    semetricCompare(recoil.util.compare({
        foo: 'b'
    }, {
        foo: 'a'
    }), 1);


    var loopTestA = {
        v:    'a',
        some: {}
    };
    var loopTestB = {
        v:    'a',
        some: {}
    };

    loopTestA.some.me = loopTestA;
    loopTestB.some.me = loopTestB;

    assertEquals(recoil.util.compare(loopTestA, loopTestB), 0);

    loopTestB.some.me = loopTestA;
    semetricCompare(recoil.util.compare(loopTestA, loopTestB), -1);

}

// function testOptions () {
//     // var testee = recoil.util.Options('a', 'b', {d: ['x', 'y', 'z']});
//

//     // var val = testee.a('abc').b(2).struct();
//     // assertObjectEquals(val, {a: 'abc', b: 2});
//
//     var val = testee.a('abc').b([1, 2, 3]).struct();
//     assertObjectEquals(val, {a: 'abc', b: [1, 2, 3]});
//
//
//     assertThrows("unknown value", function () {
//         testee.c(3);
//     });
//
//     assertThrows("dup value",function () {
//         testee.a(3).a(3);
//     });
//     assertObjectEquals(testee.struct(), {});
//
//     val = testee.d(5, 6, 7).struct();
//     assertObjectEquals(val, {d_x: 5, d_y : 6, d_z: 7});
// }