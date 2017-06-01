goog.provide('recoil.frp.LogicTest');

goog.require('recoil.frp.logic');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.frp.LogicTest');

function testAnd () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(true);
    var yB = frp.createB(true);
    var zB = frp.createB(true);

    var testeeB = recoil.frp.logic.and(xB, yB, zB);
    var testee2B = recoil.frp.logic.and(xB, true, zB);
  
    frp.attach(testeeB);
    frp.attach(testee2B);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set(false);
    }, xB);

    assertEquals(false, testeeB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set(true);
        yB.set(false);
    }, xB);

    assertEquals(false, testeeB.unsafeMetaGet().get());

    assertThrows (function (){recoil.frp.logic.and(false, true, true);});
}


function testOr () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(false);
    var yB = frp.createB(false);
    var zB = frp.createB(false);

    var testeeB = recoil.frp.logic.or(xB, yB, zB);
    var testee2B = recoil.frp.logic.or(xB, false, zB);
  
    frp.attach(testeeB);
    frp.attach(testee2B);

    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set(true);
    }, xB);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());


    frp.accessTrans(function () {
        xB.set(false);
        yB.set(true);
    }, xB);


    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());

    assertThrows (function (){recoil.frp.logic.or(false, true, true);});
}


function testAndShortCircuit () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(true);
    var yB = frp.createB(true);
    var zB = frp.createNotReadyB();

    var testeeB = recoil.frp.logic.sc.and(xB, yB, zB);
    var testee2B = recoil.frp.logic.sc.and(xB, true, zB);
  
    frp.attach(testeeB);
    frp.attach(testee2B);

    assertEquals(false, testeeB.unsafeMetaGet().ready());
    assertEquals(false, testee2B.unsafeMetaGet().ready());

    frp.accessTrans(function () {
        xB.set(false);
    }, xB);

    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set(true);
        yB.set(false);
    }, xB);

    assertEquals(false, testeeB.unsafeMetaGet().get());

    assertThrows (function () {recoil.frp.logic.sc.and(false, true, true);});
}


function testOrShortCircuit () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(true);
    var yB = frp.createB(true);
    var zB = frp.createNotReadyB();

    var testeeB = recoil.frp.logic.sc.or(xB, yB, zB);
    var testee2B = recoil.frp.logic.sc.or(xB, true, zB);
  
    frp.attach(testeeB);
    frp.attach(testee2B);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set(false);
    }, xB);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        yB.set(false);
    }, yB);

    assertEquals(false, testeeB.unsafeMetaGet().ready());
    assertEquals(true, testee2B.unsafeMetaGet().get());

    assertThrows (function () {recoil.frp.logic.sc.or(false, true, true);});
}


function testEquals () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(1);
    var yB = frp.createB(2);

    var testeeB = recoil.frp.logic.equal(xB, yB);
    var testee1B = recoil.frp.logic.equal(8, yB);
    var testee2B = recoil.frp.logic.equal(xB, 8);
    frp.attach(testeeB);
    frp.attach(testee1B);
    frp.attach(testee2B);

    
    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee1B.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());
    
    frp.accessTrans(function () {
        yB.set(1);
    }, yB);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee1B.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        yB.set(8);
    }, yB);

    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee1B.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());


    
    frp.accessTrans(function () {
        xB.set(8);
    }, xB);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee1B.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());


    assertThrows (function () {recoil.frp.logic.equals(1,1);});
    
}


function testNotEquals () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(1);
    var yB = frp.createB(2);

    var testeeB = recoil.frp.logic.notEqual(xB, yB);
    var testee1B = recoil.frp.logic.notEqual(8, yB);
    var testee2B = recoil.frp.logic.notEqual(xB, 8);
    frp.attach(testeeB);
    frp.attach(testee1B);
    frp.attach(testee2B);

    
    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee1B.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());
    
    frp.accessTrans(function () {
        yB.set(1);
    }, yB);

    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(true, testee1B.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        yB.set(8);
    }, yB);

    assertEquals(true, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee1B.unsafeMetaGet().get());
    assertEquals(true, testee2B.unsafeMetaGet().get());


    
    frp.accessTrans(function () {
        xB.set(8);
    }, xB);

    assertEquals(false, testeeB.unsafeMetaGet().get());
    assertEquals(false, testee1B.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());


    assertThrows (function () {recoil.frp.logic.notEquals(1,1);});
    
}



function testCompare () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB(1);
    var yB = frp.createB(2);

    var testeeGtB = recoil.frp.logic.gt(xB, yB);
    var testeeGteB = recoil.frp.logic.gte(xB, yB);
    var testeeLtB = recoil.frp.logic.lt(xB, yB);
    var testeeLteB = recoil.frp.logic.lte(xB, yB);
    frp.attach(testeeGtB);
    frp.attach(testeeGteB);
    frp.attach(testeeLtB);
    frp.attach(testeeLteB);
    
    assertEquals(false, testeeGtB.unsafeMetaGet().get());
    assertEquals(false, testeeGteB.unsafeMetaGet().get());
    assertEquals(true, testeeLtB.unsafeMetaGet().get());
    assertEquals(true, testeeLteB.unsafeMetaGet().get());

    
    frp.accessTrans(function () {
        yB.set(1);
    }, yB);
    
    assertEquals(false, testeeGtB.unsafeMetaGet().get());
    assertEquals(true, testeeGteB.unsafeMetaGet().get());
    assertEquals(false, testeeLtB.unsafeMetaGet().get());
    assertEquals(true, testeeLteB.unsafeMetaGet().get());
    

    frp.accessTrans(function () {
        xB.set(2);
    }, yB);

    assertEquals(true, testeeGtB.unsafeMetaGet().get());
    assertEquals(true, testeeGteB.unsafeMetaGet().get());
    assertEquals(false, testeeLtB.unsafeMetaGet().get());
    assertEquals(false, testeeLteB.unsafeMetaGet().get());

    // test object compare
    frp.accessTrans(function () {
        xB.set({a:1});
        yB.set({a:2});
    }, yB);

    assertEquals(false, testeeGtB.unsafeMetaGet().get());
    assertEquals(false, testeeGteB.unsafeMetaGet().get());
    assertEquals(true, testeeLtB.unsafeMetaGet().get());
    assertEquals(true, testeeLteB.unsafeMetaGet().get());
    
}
