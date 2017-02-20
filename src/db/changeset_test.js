goog.provide('recoil.db.ChangeSetTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.ChangeSet');
goog.require('recoil.db.ChangeSet.Path');

goog.setTestOnly('recoil.db.ChangeSetTest');

var schema = {
    root : {
        obj1 : {
           
            children : {
                a : {},
                b : {
                    children: {
                        c: {}
                    }
                }
            }
        },
        a: {
            children: {
                b: {
                    children : {
                        c: {
                            keys : ['k']
                        }
                    }
                }
            }
        },

        e: {
            children: {
                f: {
                    children : {
                        g: {
                            keys : ['k']
                        }
                    }
                }
            }
        },

        key1: {
            children : {
                k: {},
                v: {}
            },
            keys : ['k']
        }
            
    },


                
    meta1 : function (path, opt_keys) {
        var keys = opt_keys || [];
        var parts = path.parts();
        var cur = schema.root[parts[0]];
        if (cur.keys) {
            cur.keys.forEach(function (k) {
                keys.push(k);
            });
        }
        
        for (var i = 1; i < parts.length; i++) {
            var part = parts[i];
            cur = cur.children[part];

            if (cur && cur.keys) {
                cur.keys.forEach(function (k) {
                    keys.push(k);
                });
            }

        }
        return cur;
    },
    
    meta : function (path, opt_keys) {
        var keys = opt_keys || [];
        var parts = path.parts();
        var cur = schema.root;
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            cur = cur[part].children;
           
        }
        return cur;
    },
    
    children: function (path) {
        var parts = path.parts();
        var cur = schema.root;
        for (var i = 0; i < parts.length; i++) {
            cur = cur[parts[i]].children;
        }
        if (cur === undefined) {
            return [];
        }
        return Object.keys(cur);
    },
    keys: function (path) {
        var meta = schema.meta1(path);
        var k = meta ? meta.keys  : [];
        return k === undefined ? [] : k;
    },
    createKeyPath: function (path, obj) {
        var keys = schema.keys(path);
        if (!obj) {
            return path;
        }
        var keyValues = [];
        
        keys.forEach(function (k) {
            keyValues.push(obj[k]);
        });
        return path.setKeys(keys, keyValues);
    },
    absolute : function (path) {
        return path.prepend([new recoil.db.ChangeSet.PathItem('test',[],[])]);
    },
        
    isKeyedList: function (path) {
        var keys = [];
        var meta = schema.meta1(path, keys);
        if (meta && meta.keys && meta.keys.length > 0) {
            return keys.length > path.keys().length;
        }
        return false;
    },
        
    isLeaf: function (path) {
        return schema.children(path).length === 0;
    }
    
};

function assertSameObjects (a, b, c) {
    var expected = nonCommentArg(1, 2, arguments);
    var actual = nonCommentArg(2, 2, arguments);
    var message = commentArg(2, arguments);

    assertTrue(
        'Bad arguments to assertSameElements(opt_message, expected: ' +
            'ArrayLike, actual: ArrayLike)',
        goog.isArrayLike(expected) && goog.isArrayLike(actual));
    
    assertEquals(expected.length, actual.length);

    for (var i = 0; i < actual.length; i++) {
        var toFind = actual[i];
        for (var j = 0; j < expected.length; j++) {
            if (recoil.util.object.isEqual(toFind, expected[j])) {
                break;
            }
        }
        assertFalse("Element " + i + '[' + toFind + '] not found in expected', j === expected.length);
    }

    for (i = 0; i < expected.length; i++) {
        toFind = expected[i];
        for (j = 0; j < actual.length; j++) {
            if (recoil.util.object.isEqual(toFind, actual[j])) {
                break;
            }
        }
        assertFalse("Element " + i + '[' + toFind + '] not found in actual', j === expected.length);
    }

    
}
    
    
function testDiffChange() {

    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/obj1');
    var outPath = testee.Path.fromString('/test/obj1');
    // basic set
    var changes = testee.diff({a:1}, {a:2},
                              path,'orig',
                              schema);
    assertObjectEquals({changes: [new testee.Set(outPath.appendName('a'), 1, 2)], errors: []},changes);

    // set inside sub object
    changes = testee.diff({a:1, b: {c:1}}, {a:2, b: {c:2}},
                          path,'orig',
                          schema);
    
    assertSameObjects([
        new testee.Set(outPath.appendName('b').appendName('c'), 1, 2),
        new testee.Set(outPath.appendName('a'), 1, 2),
    ],changes.changes);

    assertObjectEquals([], changes.errors);


}

function testDiffInsert() {

    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/obj1');
    var outPath = testee.Path.fromString('/test/obj1');
    var changes = testee.diff({a:1}, {a:1, b: {c: 3}},
                              path,'orig',
                              schema);
    assertObjectEquals({changes: [new testee.Add(outPath.appendName('b'), [new testee.Set(outPath.appendNames(['b','c']), null, 3)])], errors :[]},changes);


}

function testDiffDelete() {

    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/obj1');
    var outPath = testee.Path.fromString('/test/obj1');
    var changes = testee.diff({a:1, b: {c: 3}}, {a:1},
                              path,'orig',
                              schema);
    assertObjectEquals({changes: [new testee.Delete(outPath.appendName('b'))], errors:[]},changes);
}


function testDiffKeyMove() {


    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/key1');
    var outPath = testee.Path.fromString('/test/key1');

    var changes = testee.diff([{k:1, v: 1}, {k:2, v: 2}, {k:3, v:3}], [{orig:[1], k:2, v:1}, {orig:[2], k:3, v:2},{orig: [3], k:4, v:3}],
                              path,'orig',
                              schema);
    assertObjectEquals({changes: [
        new testee.Move(outPath.setKeys(['k'],[3]),outPath.setKeys(['k'],[4]),[]),
        new testee.Move(outPath.setKeys(['k'],[2]),outPath.setKeys(['k'],[3]),[]),
        new testee.Move(outPath.setKeys(['k'],[1]),outPath.setKeys(['k'],[2]),[])
    ], errors: []},changes);

    changes = testee.diff([{k:1, v: 1}, {k:2, v: 2}, {k:3, v:3}], [{orig:[1],k:2, v:10}, {orig:[2],k:3, v:2},{orig:[3],k:4, v:3}],
                          path,'orig',
                          schema);
    assertObjectEquals({changes: [
        new testee.Move(outPath.setKeys(['k'],[3]),outPath.setKeys(['k'],[4]),[]),
        new testee.Move(outPath.setKeys(['k'],[2]),outPath.setKeys(['k'],[3]),[]),
        new testee.Move(outPath.setKeys(['k'],[1]),outPath.setKeys(['k'],[2]),[ 
            new testee.Set(outPath.setKeys(['k'],[1]).appendName('v'), 1, 10)]
        )
    ], errors:[]},changes);
                              // check loop
}

function testDiffKeyChangeNonKey() {


    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/key1');
    var outPath = testee.Path.fromString('/test/key1');

    var changes = testee.diff([{k:1, v: 1}, {k:2, v: 2}], [{orig:[1], k:1, v:1}, {orig:[2], k:2, v:3}],
                              path,'orig',
                              schema);
    assertObjectEquals({changes: [
        new testee.Set(outPath.setKeys(['k'],[2]).appendName('v'),2,3)
    ], errors: []},changes);
}

function testDiffKeyMoveLoop() {


    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/key1');
    var outPath = testee.Path.fromString('/test/key1');

    var changes = testee.diff([{k:1, v: 1}, {k:2, v: 2}, {k:3, v:3}], [{orig:[1],k:2, v:1}, {orig:[2],k:3, v:2},{orig:[3],k:1, v:3}],
                              path,'orig',
                              schema);

    assertSameObjects([
        new testee.DupPk(outPath.setKeys(['k'],[1])),
        new testee.DupPk(outPath.setKeys(['k'],[2])),
        new testee.DupPk(outPath.setKeys(['k'],[3]))], changes.errors);
        
    assertObjectEquals([],changes.changes);
}


function testDiffKeyInsert() {
    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/key1');
    var outPath = testee.Path.fromString('/test/key1');

    var changes = testee.diff([],[{k:1, v:1}],
                              path,'orig',
                              schema);

    assertObjectEquals({changes: [
        new testee.Add(outPath.setKeys(['k'],[1]), [
            new testee.Set(outPath.setKeys(['k'],[1]).appendName('v'), null, 1)])], errors: []}
                       , changes);
}

function testDiffKeyRemove() {
    var testee = recoil.db.ChangeSet;

    var path = testee.Path.fromString('/key1');
    var outPath = testee.Path.fromString('/test/key1');
    
    var changes = testee.diff([{k:1, v:1}],[],
                              path,'orig',
                              schema);

    assertObjectEquals({changes: [
        new testee.Delete(outPath.setKeys(['k'],[1]))], errors: []}
                       , changes);
}


function testSerialize () {
    var testee = recoil.db.ChangeSet;
    var path = testee.Path.fromString('/a/b/c').setKeys(['k'], [2]);
    var path2 = testee.Path.fromString('/e/f/g').setKeys(['k'], [3]);
    var compressor = new recoil.db.ChangeSet.DefaultPathCompressor ();
    var vser = {
        serialize: function (path,  v) {
            return path.pathAsString() + v;
        },
        deserialize: function (path, v) {
            var p = path.pathAsString();
            var s =  v.substr(p.length);
            if (s.match(/^[0-9]+$/)) {
                return parseInt(s);
            }
            return s;
        }
    };
    assertObjectEquals({parts:'a/b/c', params:['/a/b/c/k2']},path.serialize(vser, compressor));
    assertObjectEquals(path, testee.Path.deserialize(path.serialize(vser, compressor), schema, vser,compressor));

    var set = new testee.Set(path, 1, 2);
    var move = new testee.Move(path, path2, [set]);
    var add = new testee.Add(path,[set]);
    var del = new testee.Delete(path,[set]);
    assertObjectEquals(move, testee.Change.deserialize(move.serialize(true, vser), schema, vser));
    assertObjectEquals(set, testee.Change.deserialize(set.serialize(true, vser), schema, vser));
    assertObjectEquals(add, testee.Change.deserialize(add.serialize(true, vser), schema, vser));
    assertObjectEquals(del, testee.Change.deserialize(del.serialize(true, vser), schema, vser));
    var res = set.serialize(true, vser);
    assertObjectEquals({type: testee.Change.Type.SET, old: '/a/b/c1', new: '/a/b/c2',
                        path:{parts:'a/b/c', params:['/a/b/c/k2']}}, res);

    
    // check it serializes keys and values
}

