goog.provide('recoil.db.PathTest');

goog.require('goog.testing.jsunit');
goog.require('goog.structs.AvlTree');
goog.require('recoil.db.Path');


function testArray() {
    var obj = {a:[1,2,3]};

    var path = new recoil.db.Path(['a','[#]']);

    var check = [];

    path.forEach(obj, function (v) {
        check.push(v);
    });
    assertArrayEquals([1,2,3], check);
}


function testObject() {
    var obj = {a: {a: 1, b: 2, c: 3}};

    var path = new recoil.db.Path(['a','[obj]']);

    var check = [];

    path.forEach(obj, function (v) {
        check.push(v);
    });
    assertArrayEquals([1,2,3], check);
}

function testAvl() {
    var avl = new goog.structs.AvlTree();
    avl.add(1);
    avl.add(2);
    avl.add(3);
    
    var obj = {a: avl};

    var path = new recoil.db.Path(['a','[map]']);

    var check = [];

    path.forEach(obj, function (v) {
        check.push(v);
    });
    assertArrayEquals([1,2,3], check);
}
function testAll() {
    var avl1 = new goog.structs.AvlTree(function (x, y) { return x.k - y.k;});
    avl1.add({k : 1, v: {a : 1, b: 2, c: 3}});
    avl1.add({k : 2, v: {d : 4, e: 5}});
    avl1.add({k : 3, v: {d : 6}});

    var avl2 = new goog.structs.AvlTree(function (x, y) { return x.k - y.k;});
    avl2.add({k : 21, v : {x: 8}});
    avl2.add({k : 22, v : { w: 9, y: 10}});
    avl2.add({k : 23, v : {z: 11}});
    avl2.add({k : 23});

    var obj = {a: [avl1, avl2]};

    var path = new recoil.db.Path(['a','[#]','[map]','v','[obj]']);

    var check = [];

    path.forEach(obj, function (v) {
        check.push(v);
    });
    assertArrayEquals([1,2,3, 4,5,6,8,9,10,11], check);
}
