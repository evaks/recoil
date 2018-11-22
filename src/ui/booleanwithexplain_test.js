goog.provide('recoil.ui.BoolWithExplanationTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.ui.BoolWithExplanation');


goog.setTestOnly('recoil.ui.BoolWithExplanationTest');

function testAnd() {
    var x = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg1'));
    var y = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg2'));
    var z = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg3'));

    var res = x.and(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg2 and msg3",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg3'));

    res = x.and(y,z);
    assertFalse(res.val());
    assertEquals("msg3",res.reason().toString());

    res = res.not();
    assertTrue(res.val());
    assertEquals("msg3",res.reason().toString());

    y = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg2'));

    res = x.and(y,z);
    assertFalse(res.val());
    assertEquals("msg2 and msg3",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage(''));
    y = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg2'));

    res = x.and(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg2",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(true);

    res = x.and(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg2",res.reason().toString());

}

function testOr() {
    var x = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg1'));
    var y = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg2'));
    var z = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg3'));

    var res = x.or(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg2 and msg3",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg3'));

    res = x.or(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg2",res.reason().toString());

    res = res.not();
    assertFalse(res.val());
    assertEquals("msg1 and msg2",res.reason().toString());

    y = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg2'));

    res = x.or(y,z);
    assertTrue(res.val());
    assertEquals("msg1",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage(''));
    y = new recoil.ui.BoolWithExplanation(true,recoil.ui.message.toMessage('msg3'));

    res = x.or(y,z);
    assertTrue(res.val());
    assertEquals("msg1 and msg3",res.reason().toString());

    z = new recoil.ui.BoolWithExplanation(true);

    res = x.or(y,z);
    assertTrue("x z",res.val());
    assertEquals("msg1 and msg3",res.reason().toString());
    
    x = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg1'));
    y = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg2'));
    z = new recoil.ui.BoolWithExplanation(false,recoil.ui.message.toMessage('msg3'));

    res = x.or(y,z);
    assertFalse("x y z",res.val());
    assertEquals("msg1 or msg2 or msg3",res.reason().toString());
    
}


