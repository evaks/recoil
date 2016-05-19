goog.provide('recoil.frp.FrpTest');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.style');
goog.require('goog.testing.jsunit');
goog.require('recoil.exception.NoAccessors');
goog.require('recoil.exception.NotAttached');
goog.require('recoil.exception.NotInTransaction');
goog.require('recoil.frp.Frp');
goog.require('recoil.util');

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


    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var b = frp.createB(2);

    assertEquals(2, b.unsafeMetaGet().get());

    var c = frp.liftB(add1, b);

    // nothing should propagate yet we need to attach it
    assertFalse(c.unsafeMetaGet().ready());


    tm.attach(c);

    assertEquals(3, c.unsafeMetaGet().get());

    assertEquals(1, count1);
    var d = frp.liftB(add2, c);

    tm.attach(d);
    assertEquals('no extra fire', 1, count1);
    assertEquals('one fire', 1, count2);

    assertEquals(4, d.unsafeMetaGet().get());
}

function testEventDown() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    function add1(opts) {
        return function (val) {
            console.log("add", val);
            opts.val = val;
            opts.count++;
            var res = [];
            for (var i = 0; i < val.length; i++) {
                res.push(val[i] + 1);
            }
            return res;
        };
        
    }

    function sub1(opts) {
        return function (evt, x) {
            console.log("sub", evt);
            opts.ival = evt;
            opts.icount++;
            for (var i = 0; i < evt.length; i++) {
                x.set(evt[i] - 1);
            }
        };
    }

    var e = frp.createE();
    var e0Opts = {count: 0, icount : 0};
    var e1Opts = {count: 0, icount : 0};
    var e2Opts = {count : 0, icount : 0};

    var e0 = frp.liftE(add1(e0Opts),  e);
    var e1 = frp.liftEI(add1(e1Opts), sub1(e1Opts), e0);
    var e2 = frp.liftEI(add1(e2Opts), sub1(e2Opts), e1);
    tm.attach(e2);

    assertEquals(null, e1.unsafeMetaGet().get());
    assertEquals(null, e2.unsafeMetaGet().get());
    assertEquals(0, e1Opts.count);
    assertEquals(0, e1Opts.icount);
    assertEquals(0, e2Opts.count);
    assertEquals(0, e2Opts.icount);


    frp.accessTrans(function() {
	e.set(3);
	e.set(4);
    }, e);

    assertEquals(null, e1.unsafeMetaGet().get());
    assertEquals(null, e2.unsafeMetaGet().get());
    assertEquals(1, e1Opts.count);
    assertEquals(0, e1Opts.icount);
    assertEquals(1, e2Opts.count);
    assertEquals(0, e2Opts.icount);
    assertArrayEquals([4,5], e1Opts.val);
    assertArrayEquals([5,6], e2Opts.val);


    frp.accessTrans(function() {
	e2.set(7);
	e2.set(8);
    }, e2);

    assertEquals(null, e1.unsafeMetaGet().get());
    assertEquals(null, e2.unsafeMetaGet().get());
    assertEquals(1, e1Opts.count);
    assertEquals(1, e1Opts.icount);
    assertEquals(1, e2Opts.count);
    assertEquals(1, e2Opts.icount);
    assertArrayEquals([6,7], e1Opts.ival);
    assertArrayEquals([7,8], e2Opts.ival);
    
}

function testEventUp() {
    var count1 = 0;
    var count2 = 0;
    var count3 = 0;
    var val1 = 0;
    var val2 = 0;
    function add1(a) {
	console.log('add 1', a);
	val1 = a;
        count1++;
        var res = [];
        for (var i = 0; i < a.length; i++) {
            res.push(a[i] + 1);
        }
        return res;
    }
    function add2(a) {
        val2 = a;
        count2++;
        var res = [];
        for (var i = 0; i < a.length; i++) {
            res.push(a[i] + 1);
        }
        return res;
    }

    function filterAll(a) {
        return [];
    }


    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var b = frp.createE();
    frp.accessTrans(function() {
	b.set(2);
    }, b);
    var c = frp.liftE(add1, b);
    var d = frp.liftE(add2, c);
    var filtered = frp.liftE(function () {
        count3++;
    }, frp.liftE(filterAll, c));
    
    // get should always be null outside of the transaction
    assertFalse(c.unsafeMetaGet().ready());
    assertEquals(0, val1);
    assertEquals(0, count1);

    tm.attach(c);

    assertEquals(null, c.unsafeMetaGet().get());
    assertEquals(0, val1);
    assertEquals(0, count1);

    // we might need to split this up so we wait for the update
    frp.accessTrans(function() {
	b.set(2);
    });
    assertEquals(null, c.unsafeMetaGet().get());
    assertEquals(1, count1);
    assertArrayEquals([2], val1);

    frp.accessTrans(function() {
	b.set(3);
	b.set(4);
    });

    assertEquals(null, c.unsafeMetaGet().get());
    assertEquals(2, count1);
    assertEquals(0, count2);
    assertArrayEquals([3,4], val1);

    tm.attach(d);
    tm.attach(filtered);

    frp.accessTrans(function() {
	b.set(5);
	b.set(6);
    });

    assertEquals(null, c.unsafeMetaGet().get());
    assertEquals(3, count1);
    assertEquals(1, count2);
    assertEquals(0, count3);
    assertArrayEquals([5,6], val1);
    assertArrayEquals([6,7], val2);

}


function testBehaviourDown() {
    var count1 = 0;
    var count2 = 0;
    function add1(a) {
        count1++;
        return a + 1;
    }

    function sub1(val, a) {
        a.set(val - 1);
    }

    function add2(a) {
        count2++;
        return a + 1;
    }


    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var b = frp.createB(2);

    var c = frp.liftBI(add1, sub1, b);
    tm.attach(c);
    tm.doTrans(function() {
        recoil.frp.Frp.access(function() {
          c.set(7);
        }, c);
    });

    assertEquals(6, b.unsafeMetaGet().get());

    tm.detach(c);

}
function testSwitchBDown() {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var src1 = frp.createB(1);
    var src2 = frp.createB(2);

    function make1Or2(val) {
        if (val) {
            return src1;
        } else {
            return src2;
        }
    }

    var c = frp.createB(true);
    c.name = 'C';

    var d = frp.liftB(make1Or2, c);
    d.name = 'd';

    var switchTest = frp.switchB(d);
    switchTest.name = 'switchTest';

    tm.attach(switchTest);

    assertEquals(1, switchTest.unsafeMetaGet().get());

    recoil.frp.Frp.access(function() {
      tm.doTrans(function() {
          switchTest.set(11);
      });
    }, switchTest);

    assertEquals(11, src1.unsafeMetaGet().get());

    tm.doTrans(function() {
        c.set(false);
    });

    assertEquals(2, switchTest.unsafeMetaGet().get());

    tm.detach(switchTest);

}
function testConst() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var count = 0;

    var one = frp.createConstB(1);
    var two = frp.liftB(function(a) {return a + 1;}, one);
    var three = frp.liftB(function(a) {count++;return a + 1;},two);
    assertEquals('zero fire', 0, count);


    tm.attach(three);
    assertEquals('one fire', 1, count);

      tm.doTrans(function() {
        recoil.frp.Frp.access(function() {
          two.set(3);
        }, two);
    });
    recoil.frp.Frp.access(function() {
        assertEquals('value right', 3, three.get());
    }, three);
    assertEquals('one fire again', 1, count);
    tm.detach(three);

}
function testNoSetOutsideTransaction() {


    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var one = frp.createB(1);

    one.set(2);

    var two = frp.liftB(function(a) {return a + 1;}, one);

    try {
      two.set(3);
         fail('expected exception');
    } catch (e) {
        assertTrue(e instanceof recoil.exception.NotAttached);
    }

    tm.attach(two);
    try {
      two.set(3);
         fail('expected exception');
    } catch (e) {
        assertTrue(e instanceof recoil.exception.NoAccessors);
    }

    recoil.frp.Frp.access(function() {
        try {
          two.set(3);
             fail('expected exception');
        } catch (e) {
            assertTrue(e instanceof recoil.exception.NotInTransaction);
        }
    }, two);

    recoil.frp.Frp.access(function() {
      tm.doTrans(function() {
          two.set(3);
        });
    }, two);
}

function testLiftBOnlyGood() {

    var frp = new recoil.frp.Frp();

    function testNotCall() {
        fail('should not be called');
    }
    var a = frp.createMetaB(recoil.frp.BStatus.notReady());
    var d = frp.liftB(testNotCall, a);
    frp.attach(d);
    frp.detach(d);


}

function testSwitchBOutsideBehaviour() {
    
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    
    var a = frp.createB(frp.liftB(
        function(z) {return z + ".";},frp.createB("hello")));
    var b = frp.switchB(a);
    var c = frp.liftB(function (v) { return v;}, b);
    frp.attach(c);
    frp.attach(c);
    assertEquals("hello.",c.unsafeMetaGet().get());
    frp.detach(c);
    frp.detach(c);


}

function testSwitchBUp() {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    function make1Or2(val) {
        if (val) {
            return frp.createB(1);
        } else {
            var two = frp.createB(1);
            return frp.liftB(function(a) {return a + 1;}, two);
        }
    }

    var c = frp.createB(true);
    c.name = 'C';

    var d = frp.liftB(make1Or2, c);
    d.name = 'd';

    var switchTest = frp.switchB(d);
    switchTest.name = 'switchTest';

    tm.attach(switchTest);

    assertEquals(1, switchTest.unsafeMetaGet().get());

    tm.doTrans(function() {
        c.set(false);
    });

    assertEquals(2, switchTest.unsafeMetaGet().get());

    tm.detach(switchTest);
}

function testAttachDetach() {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var one = frp.createB(1);
    var two = frp.liftB(function(a) {return a + 1;},one);

    one.set(2);

    tm.attach(two);
    try {
      one.set(3);
      fail('expected exception');
    }
    catch (e) {
        assertTrue(e instanceof recoil.exception.NotInTransaction);
   }
    tm.detach(two);
    one.set(1);
}

function testDependancyRemoved() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var count = 0;
    var one = frp.createB(1);
    var two = frp.liftB(function(a) {count++;return a + 1;},one);
    var three = frp.liftB(function(a) {return a + 1;},two);
    var four = frp.liftB(function(a) {return a + 1;},three);

    tm.attach(four);
    tm.attach(two);
    assertEquals(4, four.unsafeMetaGet().get());
    tm.detach(four);
    frp.accessTrans(function() {
        one.set(2);
    }, one);
    
}

/**
 * this tests if the behaviours returned in a switch b
 * are created after the switchb and not inside the actual 
 * liftB of the behaviour in the switch b
 */
function testOutOfOrderSwitchB() {


    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var map  = {0: frp.createB("a")};
    var chooserB =  frp.createB(0);
    var selectorB = frp.liftB(function (v) {
        console.log("V", v, map[v]);
        return map[v];
    },chooserB);

    
    var swB = frp.switchB(selectorB);

    tm.attach(swB);


    assertEquals("a", swB.unsafeMetaGet().get());
    
    map[1]= frp.createB("b");
    frp.accessTrans(function() {
        chooserB.set(1);
    }, chooserB);
        

    assertEquals("b", swB.unsafeMetaGet().get());


    
    frp.accessTrans(function() {
        map[1].set("bb");
    }, chooserB);

    assertEquals("bb", swB.unsafeMetaGet().get());


     
}

function testSameBehaviour() {
    assertTrue("not implemented yet", false);
}
