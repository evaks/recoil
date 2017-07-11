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

    tm.detach(d);
    tm.detach(c);
    assertEquals(0, tm.watching());
}

function testDetachWhileInTrans() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var b = frp.createB(2);
    var c = frp.liftBI(function (v) {return v}, function (v) {b.set(v);tm.detach(c)}, b);

    tm.attach(c);
    frp.accessTrans(function (v) {c.set(1)},c);
    //assertTrue(b.dirtyDown_);

    tm.attach(c);

    assertEquals(2, c.unsafeMetaGet().get());
    assertEquals(2, b.unsafeMetaGet().get());

}
function testEventDown() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    function add1(opts) {
        return function (val) {
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

    assertArrayEquals([], e1.unsafeMetaGet().get());
    assertArrayEquals([], e2.unsafeMetaGet().get());
    assertEquals(0, e1Opts.count);
    assertEquals(0, e1Opts.icount);
    assertEquals(0, e2Opts.count);
    assertEquals(0, e2Opts.icount);


    frp.accessTrans(function() {
	e.set(3);
	e.set(4);
    }, e);

    assertArrayEquals([], e1.unsafeMetaGet().get());
    assertArrayEquals([], e2.unsafeMetaGet().get());
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

    assertArrayEquals([], e1.unsafeMetaGet().get());
    assertArrayEquals([], e2.unsafeMetaGet().get());
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

    assertArrayEquals([], c.unsafeMetaGet().get());
    assertEquals(0, val1);
    assertEquals(0, count1);

    // we might need to split this up so we wait for the update
    frp.accessTrans(function() {
	b.set(2);
    });
    assertArrayEquals([], c.unsafeMetaGet().get());
    assertEquals(1, count1);
    assertArrayEquals([2], val1);

    frp.accessTrans(function() {
	b.set(3);
	b.set(4);
    });

    assertArrayEquals([], c.unsafeMetaGet().get());
    assertEquals(2, count1);
    assertEquals(0, count2);
    assertArrayEquals([3,4], val1);

    tm.attach(d);
    tm.attach(filtered);

    frp.accessTrans(function() {
	b.set(5);
	b.set(6);
    });

    assertArrayEquals([], c.unsafeMetaGet().get());
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

function testSwitchBNotReady() {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var src1 = frp.createMetaB(recoil.frp.BStatus.notReady());
    
    var src2 = frp.createB(src1);

    var sw = frp.switchB(src2);

    tm.attach(sw);
    assertFalse(sw.unsafeMetaGet().ready());

    tm.detach(sw);
    assertEquals(0, tm.watching());
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
    assertEquals(0, tm.watching());
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

function testSetDownOnUpAddRef () {

    

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var aBB = frp.createNotReadyB();
    var bB = frp.createNotReadyB();

   
    bB.refListen(function () {
        frp.accessTrans(function () {
            bB.set(1);
        }, bB);
    });
    aBB.refListen(function () {
        frp.accessTrans(function () {
            aBB.set(bB);
        }, aBB);
    });
         
    
    var outB = frp.switchB(aBB);
    

    tm.attach(outB);
    console.log("hi");
    assertEquals(1, outB.unsafeMetaGet().get());

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
    assertEquals(0, tm.watching());

}

function testSwitchBWithError() {
    
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    
    var errorBB = frp.createB(frp.metaLiftB(
        function(z) {return recoil.frp.BStatus.errors(['hi']);})    );
    var b = frp.switchB(errorBB);

    frp.attach(b);
    assertObjectEquals(['hi'],b.unsafeMetaGet().errors());
    frp.detach(b);

    assertEquals(0, tm.watching());


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
    assertEquals(0, tm.watching());
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
function testObserver () {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var oneB = frp.createConstB(1);
    var twoB = frp.liftBI(function (v) {return v;}, function (v) {oneB.set(v)}, oneB);

    var val;
    var obB = frp.observeB(function (v) {
        val = v.get();
    }, twoB);

    
    tm.attach(obB);
        
    assertEquals(1, val);
    frp.accessTrans(function () {
        val = 2;
        twoB.set(2);
    }, twoB);
    assertEquals(1, val);
};

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

function testSwitchBRefCount() {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    
    var a = frp.createB(0);
    var b = frp.liftB(function (x) { return x + 1;}, a);

    var c = frp.createB(1);
    var d = frp.liftB(function (x) { return x + 1;}, c);

    var selector1 = frp.createB(b);
    var testee = frp.switchB(selector1);

    tm.attach(testee);
    tm.attach(testee);

console.log("xxx");
    assertEquals("val1",1, testee.unsafeMetaGet().get());
    assertEquals("count a - 1", 2, a.getRefs(tm));
    assertEquals("count b - 1",2, b.getRefs(tm));
    assertFalse(c.hasRefs());
    assertFalse(d.hasRefs());


    frp.accessTrans(function () {
        selector1.set(d);
    }, selector1);

    assertEquals(2, testee.unsafeMetaGet().get());

    console.log("C=",c);
    assertEquals("c refs", 2, c.getRefs(tm));
    assertEquals(2, d.getRefs(tm));
    assertFalse(a.hasRefs());
    assertFalse(b.hasRefs());


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

function testSetDownOnUp () {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var oneB = frp.createB(1);
    var twoB = frp.createB(2);

    var count = 0;
    
    var threeB = frp.liftB(function() {count++, twoB.set(oneB.get()); return oneB.get();},oneB, twoB);

    tm.attach(threeB);

    assertEquals(1, twoB.unsafeMetaGet().get());
    assertEquals(2, count);

}


function testSetDownOnUpNoCalc () {

    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var oneB = frp.createB(1);
    var twoB =  frp.createB(2);
    var nullB = frp.liftBI(function() {return null;},function (v) {twoB.set(v);}, twoB);

    var count = 0;
    
    var threeB = frp.liftB(function() {count++, nullB.set(oneB.get()); return oneB.get();},oneB, nullB);

    tm.attach(threeB);

    assertEquals(1, twoB.unsafeMetaGet().get());
    assertEquals(1, count);

}

function testOnUpDirtyDown () {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var doNothing = function (v) {return v;};
    var doNothingInv = function (v,b) {b.set(v);};

    var count = 0;
    var count1 = 0;
    var zeroB = frp.createB(1);
    var oneB = frp.liftBI(
        function (v) {
            count1++;
            console.log("this", this.dirtyDown_);
            return v;
        },
        doNothingInv, zeroB);
    var twoB =  frp.liftBI(doNothing, doNothingInv, oneB);
    var threeB =  frp.liftBI(doNothing, doNothingInv, twoB);
    var fourB =  frp.liftBI(function (v) {
        frp.accessTrans(function () {
            oneB.set(2);
        }, oneB);
        return null;
    },doNothingInv, threeB);
                        
    var lastB = frp.liftB(function () {
        count++;
        return 2;
    }, fourB);
                          
    tm.attach(lastB);

    
//    assertEquals(1,recoil.frp.Frp.DirectionC);
    assertEquals(1,count);
    assertEquals(2,count1);
    assertEquals(2,lastB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        fourB.set(3);
    }, fourB);

    assertEquals(1,count);
    assertEquals(4,count1);

};

function testBehaviourClone () {
    var frp = new recoil.frp.Frp();
    var b = frp.createB(null);
    assertTrue(b === recoil.util.object.clone(b));
}
function testOnUpDirtyDown1 () {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var doNothing = function (v) {return v;};
    var doNothingInv = function (v,b) {b.set(v);};

    var count = 0;
    var count1 = 0;
    var count2 = 0;
    var zeroB = frp.createB(1);
    var zero1B = frp.createB(1);

    var oneB = frp.liftBI(
        function (v) {
            count1++;
            return null;
        },
        doNothingInv, zeroB);

    oneB.name = 'one';



    var twoB =  frp.liftBI(doNothing, doNothingInv, oneB);
    var threeB =  frp.liftBI(doNothing, doNothingInv, twoB);
    var fourB =  frp.liftBI(function (v) {
        frp.accessTrans(function () {
            oneB.set(2);
        }, oneB);
        return null;
    },doNothingInv, threeB);

    var one1B = frp.liftBI(
        function (v) {
            count2++;
            if (v) {
                throw "invalid value for 1";
            }
            return null;
        },
        doNothingInv, oneB, zero1B);
                        
    var lastB = frp.liftB(function () {
        count++;
        return 2;
    }, fourB);
                          
    tm.attach(lastB);
    tm.attach(one1B);

    
//    assertEquals(1,recoil.frp.Frp.DirectionC);
    assertEquals(1,count);
    assertEquals(1,count2);
    assertEquals(2,count1);
    assertEquals(2,lastB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        fourB.set(3);
        zero1B.set(2);
    }, fourB);

    assertEquals(1,count);
    assertEquals(4,count1);

};

function testSameBehaviour() {
//    assertTrue("not implemented yet", false);
}


