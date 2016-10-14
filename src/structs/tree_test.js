goog.provide('recoil.structs.TreeTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.Tree');

goog.setTestOnly('recoil.structs.TreeTest');

function testImmutable() {
    
    var foo = new recoil.structs.Tree("hello",[]);
    
    
    try {
        foo.foo = 1;
        fail("should be able to modify object")
    }
    catch (e) {
        // should not let me modify the
    }
    try {
        foo.children().push(1)
        fail("should be able to modify object")
    }
    catch (e) {
        // should not let me modify the
    }

}


function testInsertChild() {

    var foo = new recoil.structs.Tree("hello",[]);

    var foo1 = foo.insertChildAt(new recoil.structs.Tree("1",[]) ,1 );
    
    assertEquals("1",foo1.children()[0].value())
    assertEquals(0,foo.children().length)

    foo1 = foo1.insertChildAt(new recoil.structs.Tree("2",[]) ,1 );
    assertEquals("1",foo1.children()[0].value())
    assertEquals("2",foo1.children()[1].value())

}


