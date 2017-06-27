goog.provide('recoil.frp.ArrayTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Array');

goog.setTestOnly('recoil.frp.ArrayTest');

function testTag() {
    var frp = new recoil.frp.Frp();
    var testee = new recoil.frp.Array(frp);
    var valB = frp.createB([]);
    var aB = testee.tag(valB, 'a');
    var bB = testee.tag(valB, 'b');

    frp.attach(aB);
    frp.attach(bB);

    assertObjectEquals([], valB.unsafeMetaGet().get());
    assertObjectEquals([], aB.unsafeMetaGet().get());
    assertObjectEquals([], bB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        aB.set([{v:1}]);
    }, aB, bB);

    assertObjectEquals([{value: {v:1}, tag:'a'}], valB.unsafeMetaGet().get());
    assertObjectEquals([{v:1}], aB.unsafeMetaGet().get());
    assertObjectEquals([], bB.unsafeMetaGet().get());


    frp.accessTrans(function () {
        bB.set([{v:2}]);
    }, aB, bB);

    assertObjectEquals([{tag:'a', value: {v:1}},{tag:'b',value: {v:2}}], valB.unsafeMetaGet().get());
    assertObjectEquals([{v:1}], aB.unsafeMetaGet().get());
    assertObjectEquals([{v:2}], bB.unsafeMetaGet().get());


    frp.accessTrans(function () {
        bB.set([{v:2},{v:3}]);
    }, aB, bB);

    assertObjectEquals([{tag:'a',value:{v:1}},{tag:'b', value: {v:2}},{tag:'b', value: {v:3}}], valB.unsafeMetaGet().get());
    assertObjectEquals([{v:1}], aB.unsafeMetaGet().get());
    assertObjectEquals([{v:2},{v:3}], bB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        aB.set([]);
    }, aB, bB);
    assertObjectEquals([{tag:'b', value: {v:2}},{tag:'b', value: {v:3}}], valB.unsafeMetaGet().get());
    assertObjectEquals([], aB.unsafeMetaGet().get());
    assertObjectEquals([{v:2},{v:3}], bB.unsafeMetaGet().get());


    frp.accessTrans(function () {
        bB.set([]);
    }, aB, bB);

    assertObjectEquals([], valB.unsafeMetaGet().get());
    assertObjectEquals([], aB.unsafeMetaGet().get());
    assertObjectEquals([], bB.unsafeMetaGet().get());
}


