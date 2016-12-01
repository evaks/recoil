goog.provide('recoil.frp.ChooserTest');

goog.require('recoil.frp.Chooser');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.frp.ChooserTest');

function testUp () {

    var frp = new recoil.frp.Frp();

    var selectB = frp.createB(1);

    var testee = new recoil.frp.Chooser(selectB);

    
    testee.option(3, "hello");
    testee.option(4, "world");

    var valB = testee.bind();

    assertThrows(function () {
        testee.option(5, "wrong");
    });

        assertThrows(function () {
        testee.bind();
    });

    frp.attach(valB);

    assertFalse(valB.unsafeMetaGet().ready());

    frp.accessTrans(function () {
        selectB.set(3);
    }, selectB);

    assertEquals("hello",valB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        selectB.set(4);
    }, selectB);
    assertEquals("world",valB.unsafeMetaGet().get());

}




function testUpShortCircuit () {

    var frp = new recoil.frp.Frp();

    var selectB = frp.createB(1);


    var helloCount = 0;
    var worldCount = 0;
    var byeCount = 0;
    var helloB = frp.liftB(function (v) {
        helloCount++;
        return v;
    }, frp.createB("hello"));

    var byeB = frp.liftB(function (v) {
        byeCount++;
        return v;
    }, frp.createB("bye"));

    
    var worldB = frp.liftB(function (v) {
        worldCount++;
        return v;
    }, frp.createB("world"));


    var testee = new recoil.frp.Chooser(selectB, byeB);

    testee.option(3, helloB);
    testee.option(4, worldB);

    var valB = testee.bind();
    
    frp.attach(valB);

    assertEquals(0, helloCount);
    assertEquals(1, byeCount);
    assertEquals(0, worldCount);
    assertEquals("bye",valB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        selectB.set(3);
    }, selectB);

    assertEquals(1, helloCount);
    assertEquals(0, worldCount);
    assertEquals(1, byeCount);
    assertEquals("hello",valB.unsafeMetaGet().get());

    
    frp.accessTrans(function () {
        selectB.set(4);
    }, selectB);
    assertEquals(1, helloCount);
    assertEquals(1, worldCount);
    assertEquals(1, byeCount);
    assertEquals("world",valB.unsafeMetaGet().get());

}


function testDown () {

    var frp = new recoil.frp.Frp();

    var selectB = frp.createB(1);



    var helloB = frp.createB("hello");
    var byeB = frp.createB("bye");

    
    var worldB = frp.createB("world");


    var testee = new recoil.frp.Chooser(selectB, byeB);

    testee.option(3, helloB);
    testee.option(4, worldB);

    var valB = testee.bind();
    
    frp.attach(valB);

    assertEquals("bye",valB.unsafeMetaGet().get());
    frp.accessTrans(function () {
        valB.set("bye - set");
    }, valB);

    assertEquals("bye - set",valB.unsafeMetaGet().get());
    assertEquals("hello",helloB.unsafeMetaGet().get());
    assertEquals("world",worldB.unsafeMetaGet().get());
    assertEquals("bye - set",byeB.unsafeMetaGet().get());
    
   
    
    frp.accessTrans(function () {
        selectB.set(3);
    }, selectB);


    assertEquals("hello",valB.unsafeMetaGet().get());
    assertEquals("hello",helloB.unsafeMetaGet().get());
    assertEquals("world",worldB.unsafeMetaGet().get());
    assertEquals("bye - set",byeB.unsafeMetaGet().get());


    frp.accessTrans(function () {
        valB.set("hello - set");
    }, valB);

    assertEquals("hello - set",valB.unsafeMetaGet().get());
    assertEquals("hello - set",helloB.unsafeMetaGet().get());
    assertEquals("world",worldB.unsafeMetaGet().get());
    assertEquals("bye - set",byeB.unsafeMetaGet().get());


   
    
    frp.accessTrans(function () {
        selectB.set(4);
    }, selectB);


    assertEquals("world",valB.unsafeMetaGet().get());
    assertEquals("hello - set",helloB.unsafeMetaGet().get());
    assertEquals("world",worldB.unsafeMetaGet().get());
    assertEquals("bye - set",byeB.unsafeMetaGet().get());
    
    frp.accessTrans(function () {
        valB.set("world - set");
    }, valB);

    assertEquals("world - set",valB.unsafeMetaGet().get());
    assertEquals("hello - set",helloB.unsafeMetaGet().get());
    assertEquals("world - set",worldB.unsafeMetaGet().get());
    assertEquals("bye - set",byeB.unsafeMetaGet().get());

}
