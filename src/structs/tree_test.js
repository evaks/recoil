goog.provide('recoil.structs.TreeTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.Tree');

goog.setTestOnly('recoil.structs.TreeTest');



function testInsertChild() {

    var foo = new recoil.structs.Tree("hello","hello",[]);

    var foo1 = foo.insertChildAt(new recoil.structs.Tree("1","1",[]) ,1 );
    
    assertEquals("1",foo1.children()[0].value())
    assertEquals(0,foo.children().length)

    foo1 = foo1.insertChildAt(new recoil.structs.Tree("2","2", []) ,1 );
    assertEquals("1",foo1.children()[0].value())
    assertEquals("2",foo1.children()[1].value())

}

function testRemoveChild() {
    var c2 = new recoil.structs.Tree("2","2",[]);

    var foo = new recoil.structs.Tree("k","v",[
        new recoil.structs.Tree("1","1",[]),
        c2,
        new recoil.structs.Tree("3","3",[]),
    ]);


    var foo1 = foo.removeChild(c2);
    assertEquals("k", foo1.key());
    assertEquals("v", foo1.value());
    assertEquals(3, foo.children().length);
    assertEquals(2, foo1.children().length);
    assertEquals("1",foo1.children()[0].key());
    assertEquals("3",foo1.children()[1].key());
    assertEquals("1",foo1.children()[0].value());
    assertEquals("3",foo1.children()[1].value());

}

function testRemoveChildAt() {

    var foo = new recoil.structs.Tree("k","v",[
        new recoil.structs.Tree("1","1",[]),
        new recoil.structs.Tree("2","2",[]),
        new recoil.structs.Tree("3","3",[]),
    ]);


    var foo1 = foo.removeChildAt(1);
    assertEquals("k", foo1.key());
    assertEquals("v", foo1.value());
    assertEquals(3, foo.children().length);
    assertEquals(2, foo1.children().length);
    assertEquals("1",foo1.children()[0].key());
    assertEquals("3",foo1.children()[1].key());
    assertEquals("1",foo1.children()[0].value());
    assertEquals("3",foo1.children()[1].value());

}


