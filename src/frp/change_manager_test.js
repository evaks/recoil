goog.provide('recoil.frp.ChangeManagerTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.frp.ChangeManager');
goog.require('recoil.frp.Frp');
goog.require('recoil.util');

goog.setTestOnly('recoil.frp.ChangeManagerTest');

var gValueB;
function testChangeManager() {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();

    var changeB = frp.createMetaB(recoil.frp.BStatus.notReady());
    var valueB = frp.createMetaB(recoil.frp.BStatus.notReady());
    var applyE = frp.createE();
    var testeeB = recoil.frp.ChangeManager.create(frp, valueB, changeB, applyE);
    gValueB = valueB;
    tm.attach(testeeB);

    valueB.id = "value";
    testeeB.id = "testee";
    assertTrue(!testeeB.unsafeMetaGet().ready());

    frp.accessTrans(function () {
        valueB.set(3);
    }, valueB);
    assertTrue(testeeB.unsafeMetaGet().ready());    
    assertEquals(3, testeeB.unsafeMetaGet().get());    
    
    frp.accessTrans(function () {
        testeeB.set(4);
    }, testeeB);

    
    assertTrue(testeeB.unsafeMetaGet().ready());    
    assertEquals(3, valueB.unsafeMetaGet().get());    
    assertEquals(4, changeB.unsafeMetaGet().get());    
    assertEquals(4, testeeB.unsafeMetaGet().get());    


    frp.accessTrans(function () {
        testeeB.set(3);
    }, testeeB);

    
    assertTrue(testeeB.unsafeMetaGet().ready());    
    assertEquals(3, valueB.unsafeMetaGet().get());    
    assertFalse(changeB.unsafeMetaGet().ready());    
    assertEquals(3, testeeB.unsafeMetaGet().get());    


    frp.accessTrans(function () {
        testeeB.set(7);
    }, testeeB);

    
    assertTrue(testeeB.unsafeMetaGet().ready());    
    assertEquals(3, valueB.unsafeMetaGet().get());    
    assertEquals(7, changeB.unsafeMetaGet().get());    
    assertEquals(7, testeeB.unsafeMetaGet().get());    


    frp.accessTrans(function () {
        applyE.set(recoil.frp.ChangeManager.Action.FLUSH);
    }, applyE);

    console.log("testee", testeeB.seqStr_);
    console.log("value", valueB.seqStr_);
    assertTrue(testeeB.unsafeMetaGet().ready());    
    assertEquals(7, testeeB.unsafeMetaGet().get());    
    assertEquals(7, valueB.unsafeMetaGet().get());    
    assertFalse(changeB.unsafeMetaGet().ready());    

}
