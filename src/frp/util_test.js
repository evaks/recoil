goog.provide('recoil.frp.util.UtilTest');

goog.require('recoil.frp.Util');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.util.UtilTest');

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