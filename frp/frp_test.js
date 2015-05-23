goog.provide('recoil.frp.FrpTest');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.frp.FrpTest');

function testBehaviourUp() {
    var count1 = 0;
    var count2 = 0;
    function add1(a) {
        count1++;
        return a + 1;
    }
    function add2(a) {
        count2++;
        return a + 1;
    }

    
    var tm = new recoil.frp.TransactionManager();
    var frp = new recoil.frp.Frp();

    var b = frp.createB(2);

    assertEquals(2, b.unsafeMetaGet().get());

    var c = frp.liftB(add1, b);

    // nothing should propagate yet we need to attach it
    assertEquals(null, c.unsafeMetaGet());

    tm.attach(c);

    assertEquals(3, c.unsafeMetaGet().get());

    assertEquals(1, count1);
    var d = frp.liftB(add2, c);

    tm.attach(d);
    assertEquals('no extra fire', 1, count1);
    assertEquals('one fire', 1, count2);

    assertEquals(4, d.unsafeMetaGet().get());

}

function testSwitchBUp() {

    var tm = new recoil.frp.TransactionManager();
    var frp = new recoil.frp.Frp();

    function make1Or2(val) {
        if (val) {
            return frp.createB(1);
        } else {
            return frp.createB(2);
        }
    }

    var c = frp.createB(true);

    var switchTest = frp.switchB(frp.liftB(make1Or2, c));

    tm.attach(switchTest);

    assertEquals(1, switchTest.unsafeMetaGet().get());

}

function testIsEqual() {
    var overrideEquals = {
        equals: function(a, b) {
            return true;
        }

    };

    var loopTestA = {
        v: 'a',
        some: {}
    };
    var loopTestB = {
        v: 'a',
        some: {}
    };

    loopTestA.some.me = loopTestA;
    loopTestB.some.me = loopTestB;

    assertTrue('loop eq', recoil.frp.isEqual(loopTestA, loopTestB));

    loopTestB.some.me = loopTestA;
    assertFalse('loop neq', recoil.frp.isEqual(loopTestA, loopTestB));


    assertTrue('override left', recoil.frp.isEqual(overrideEquals, [1, 2, 3]));
    assertTrue('override right', recoil.frp.isEqual([1, 2, 3], overrideEquals));
    assertTrue('array eq', recoil.frp.isEqual([1, 2, 3], [1, 2, 3]));
    assertFalse(recoil.frp.isEqual([1, 2, 3], [1, 2, 4]));
    assertFalse(recoil.frp.isEqual([1, 2, 3], [1, 2, 3, 4]));
    assertFalse(recoil.frp.isEqual([1, 2, 3, 4], [1, 2, 3]));
    assertTrue(recoil.frp.isEqual([1, 2, 3], [1, 2, 3]));
    assertTrue(recoil.frp.isEqual(1, 1));

    assertTrue(recoil.frp.isEqual({
        foo: 'a'
    }, {
        foo: 'a'
    }));
    assertFalse(recoil.frp.isEqual({
        foo: 'a'
    }, {
        foo: 'a',
        b1: 'a'
    }));
    assertFalse(recoil.frp.isEqual({
        foo: 'b'
    }, {
        foo: 'a'
    }));
    assertFalse(recoil.frp.isEqual(3, 2));
    assertFalse(recoil.frp.isEqual(undefined, 2));
    assertFalse(recoil.frp.isEqual(2, undefined));

    assertFalse(recoil.frp.isEqual(null, 2));
    assertFalse(recoil.frp.isEqual(2, null));

    assertTrue(recoil.frp.isEqual(goog.math.Long.fromInt(1), goog.math.Long
            .fromInt(1)));
    assertFalse(recoil.frp.isEqual(goog.math.Long.fromInt(2), goog.math.Long
            .fromInt(1)));

}
