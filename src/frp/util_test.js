goog.provide('recoil.frp.util.UtilTest');

goog.require('recoil.frp.Util');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');
goog.require('recoil.frp.struct');

goog.setTestOnly('recoil.util.UtilTest');

function testGroupBind() {
    
    var frp = new recoil.frp.Frp();
    var structs = recoil.frp.struct;
    
    var testee = recoil.frp.Util.Options({'a' : 1, 'b': 2, c:3, d:4, e:2});
    var aB = frp.createB('a-');
    var bB = frp.createB('b-');
    var eB = frp.createB(3);
    var bound = testee.bind(frp, {a:aB, b: bB, e: eB});
    var groupB = bound.getGroup([bound.a, bound.b, bound.c, bound.e], function (x) {x.e = x.e + 1;return x;},  function (x) {x.e = x.e - 1;return x;});

    
    frp.attach(groupB);
    assertObjectEquals({a:'a-',b:'b-', c: 3, e: 4},groupB.unsafeMetaGet().get());

    frp.accessTrans(function() {
        groupB.set({a:'a+', b:'b+', c:7, e: 10});
    }, groupB);

    frp.accessTrans(function() {
        assertObjectEquals({a:'a+',b:'b+', c: 3, e:10},groupB.get());
        assertObjectEquals('a+',aB.get());
        assertObjectEquals('b+',bB.get());
        assertObjectEquals(9,eB.get());
    }, groupB, aB, bB, eB);

}

function testOptionsMultiAttach () {

    var frp = new recoil.frp.Frp();
    var structs = recoil.frp.struct;

    var testee = recoil.frp.Util.Options({'add' : {callback:undefined, text: 'Add'}});
    var cbB1 = frp.createB(1);
    var cbB2 = frp.createB(2);
    var val1 = testee.add({callback:cbB1}).struct();
    var val2 = testee.add({callback:cbB2}).struct();
    var addB1 = testee.bind(frp,val1).add();
    var addB2 = testee.bind(frp,val2).add();

    var ocbB1 = structs.get('callback', addB1);
    var ocbB2 = structs.get('callback', addB2);
    
    frp.attach(ocbB1);
    frp.attach(ocbB2);

    assertEquals(1,ocbB1.unsafeMetaGet().get());
    assertEquals(2,ocbB2.unsafeMetaGet().get());

    
    
};

function testOptions () {

    var frp = new recoil.frp.Frp();

    var testee = recoil.frp.Util.Options({'a' : 'xxx'}, 'b', {'d ( x ,y,z) ' : {x: 1, y : 2, z : 3}});

    var val = testee.a('xxx').b(1).d(3,4,5).struct();
    assertObjectEquals(val, {a: 'xxx', b : 1, d_x: 3, d_y : 4, d_z : 5 });

    val = testee.b(1).struct();
    assertObjectEquals(val, {b : 1});

    // var aB = testee.bind(frp, val).a();

    var bound = testee.bind(frp, val);
    var aB = bound.a();

    var bB = bound.b();
    frp.attach(aB);
    frp.attach(bB);

    assertEquals('xxx',aB.unsafeMetaGet().get());
    assertEquals(1,bB.unsafeMetaGet().get());

     aB = testee.bind (frp, {b : 1, d_x : 1, d_y : 2, d_z : 3}).a();
    frp.attach(aB);
    assertEquals('xxx',aB.unsafeMetaGet().get());

    aB = testee.bind (frp, frp.createB({b : 1})).a();
    frp.attach(aB);
    assertEquals('xxx',aB.unsafeMetaGet().get());

    aB = testee.bind (frp, {b : frp.createB(1)}).a();
    frp.attach(aB);
    assertEquals('xxx',aB.unsafeMetaGet().get());

    assertThrows("missing argument", function () {
        testee.a('xxx').struct();
    });


    testee = recoil.frp.Util.Options({'a' : 1, b: 2}, 'c');
    var strB =  testee.c(4).a(7).struct();
    bound = testee.bind(frp, strB);

    aB = bound.a();
    bB = bound.b();

    frp.attach(aB);
    frp.attach(bB);

    assertEquals(7, aB.unsafeMetaGet().get());
    assertEquals(2, bB.unsafeMetaGet().get());
    // var B = recoil.ui.widgets.SelectorWidget.options.name('fred').get();
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
