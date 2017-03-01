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
                },
                b1 : {}
            }
        },
        a1 : {
            alias : '/test/a',
            children: {
                b1 : {}
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
        },

        full: {
            children : {
                a: {
                    children: {
                        v: {},
                        v2: {},
                        list: {
                            children: {
                                k: {},
                                v: {},
                                v2: {}
                            },
                            keys: ['k']
                        }
                    }
                }
            }
        },
        'list-a': {
            children: {
                k :{},
                v :{},
                c : {
                    children: {
                        t : {}
                    }
                }
                
            },
            keys: ['k']
        },
        'cont' : {
            children: {
                c1: {
                    children: {
                        c2:{}
                    }
                }
            }
        },
        'named-a': {
            alias : '/full/a',
            children: {
                v: {},
                list: {
                    children: {
                        k: {},
                        v: {}
                    },
                    keys: ['k']
                }
            }
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
        
        for (var i = 1; i < parts.length && cur; i++) {
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
        for (var i = 0; i < parts.length && cur; i++) {
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
    exists: function (path) {
        return schema.meta1(path) ? true : false;
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
        if (path.parts()[0] === 'full' || path.parts()[0] === 'test') {
            return path;
        }
        if (path.parts()[0] === 'named-a') {
            return recoil.db.ChangeSet.Path.fromString('full/a');
        }

        var item = schema.root[path.parts()[0]];
        if (item && item.alias) {
            var prefix = recoil.db.ChangeSet.Path.fromString(item.alias);
            var parts = prefix.items();
            var pathParts = path.items();
            for (var i = 1; i < pathParts.length; i++) {
                parts.push(pathParts[i]);
            }
            
            return new recoil.db.ChangeSet.Path(parts);
        }
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
        new testee.Move(outPath.setKeys(['k'],[3]),outPath.setKeys(['k'],[4])),
        new testee.Move(outPath.setKeys(['k'],[2]),outPath.setKeys(['k'],[3])),
        new testee.Move(outPath.setKeys(['k'],[1]),outPath.setKeys(['k'],[2]))
    ], errors: []},changes);

    changes = testee.diff([{k:1, v: 1}, {k:2, v: 2}, {k:3, v:3}], [{orig:[1],k:2, v:10}, {orig:[2],k:3, v:2},{orig:[3],k:4, v:3}],
                          path,'orig',
                          schema);
    assertObjectEquals({changes: [
        new testee.Move(outPath.setKeys(['k'],[3]),outPath.setKeys(['k'],[4]),[]),
        new testee.Move(outPath.setKeys(['k'],[2]),outPath.setKeys(['k'],[3]),[]),
        new testee.Set(outPath.setKeys(['k'],[1]).appendName('v'), 1, 10),
        new testee.Move(outPath.setKeys(['k'],[1]),outPath.setKeys(['k'],[2]))
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
    var move = new testee.Move(path, path2);
    var add = new testee.Add(path,[set]);
    var del = new testee.Delete(path);
    assertObjectEquals(move, testee.Change.deserialize(move.serialize(true, vser), schema, vser));
    assertObjectEquals(set, testee.Change.deserialize(set.serialize(true, vser), schema, vser));
    assertObjectEquals(add, testee.Change.deserialize(add.serialize(true, vser), schema, vser));
    assertObjectEquals(del, testee.Change.deserialize(del.serialize(true, vser), schema, vser));
    var res = set.serialize(true, vser);
    assertObjectEquals({type: testee.Change.Type.SET, old: '/a/b/c1', new: '/a/b/c2',
                        path:{parts:'a/b/c', params:['/a/b/c/k2']}}, res);

    
    // check it serializes keys and values
}

/**
 * types of change set
 * orig changeset when we set unapply any changes
 * sending apply changes on send
 * sent apply changes on getting back conformation
 */
function testChangeDbSet() {
    var ns = recoil.db.ChangeSet;
    var testee = new recoil.db.ChangeDb(schema);
    var fullPath = ns.Path.fromString('full/a');
    var contPath = ns.Path.fromString('cont');
    var namedPath = ns.Path.fromString('named-a');
    var listA = ns.Path.fromString('list-a');
    
    assertObjectEquals([fullPath],testee.set(fullPath, {v : 1, v2: 2, list : [{k:1, v:1, v2:2},{k:2, v:2, v2: 2}]}));
    assertSameObjects([fullPath, namedPath],testee.set(namedPath, {v : 10, list : [{k:1, v:10},{k:2, v:20}]}));
    testee.set(contPath, {});

    
    assertObjectEquals({v : 10, v2: 2, list : [{k:1, v:10, v2:2},{k:2, v: 20, v2: 2}]}, testee.get(fullPath));
    assertObjectEquals({v : 10, list : [{k:1, v:10},{k:2, v: 20}]}, testee.get(namedPath));
    assertObjectEquals({}, testee.get(contPath));

    testee.set(fullPath, {v : 1, v2: 2, list : [{k:1, v:1, v2:2},{k:2, v:2, v2: 2}]});
    assertObjectEquals({v : 1, v2: 2, list : [{k:1, v:1, v2:2},{k:2, v: 2, v2: 2}]}, testee.get(fullPath));
    assertObjectEquals({v : 1, list : [{k:1, v:1},{k:2, v: 2}]}, testee.get(namedPath));


    // resolve full path that does not exist
    testee.set(listA, [{k:1, v:1}, {k:2, v:2}]);
    assertObjectEquals([{k:1, v:1}, {k:2, v:2}], testee.get(listA));
    testee.set(listA, [{k:1, v:10}, {k:2, v:20}]);
    assertObjectEquals([{k:1, v:10}, {k:2, v:20}], testee.get(listA));
    
    // now apply some changes
    var set = new ns.Set(listA.setKeys(['k'], [2]).appendName('v'), 20, 200);
    var move = new ns.Move(listA.setKeys(['k'], [1]), listA.setKeys(['k'], [11]));
    var setList = new ns.Set(listA.setKeys(['k'], [3]).appendName('v'), null, 300);
    var addList = new ns.Add(listA.setKeys(['k'],[3]),[setList]);
    var changes = [set, move];
    testee.applyChanges(changes);
    assertSameObjects([{k:11, v:10}, {k:2, v:200}], testee.get(listA));
    testee.applyChanges([addList]);
    assertSameObjects([{k:11, v:10}, {k:2, v:200}, {k:3,v:300}], testee.get(listA));

    testee.applyChanges([new ns.Add(listA.setKeys(['k'],[3]).appendName('c'),[])]);
    // add container in list

    assertSameObjects([{k:11, v:10}, {k:2, v:200}, {k:3,v:300,c:{}}], testee.get(listA));

    // add container not in list
    testee.applyChanges([new ns.Add(contPath.appendName('c1'),[])]);

    assertObjectEquals({c1:{}}, testee.get(contPath));

    // delete container in list
    testee.applyChanges([new ns.Delete(listA.setKeys(['k'],[3]).appendName('c'))]);
    assertSameObjects([{k:11, v:10}, {k:2, v:200}, {k:3,v:300}], testee.get(listA));

    // remove from list
    testee.applyChanges([new ns.Delete(listA.setKeys(['k'],[3]))]);
    assertSameObjects([{k:11, v:10}, {k:2, v:200}], testee.get(listA));

    // remove from container
    testee.applyChanges([new ns.Delete(contPath.appendName('c1'),[])]);
    assertObjectEquals({}, testee.get(contPath));

    testee.set(ns.Path.fromString('a'),{b:null});
    assertObjectEquals({b:null}, testee.get(ns.Path.fromString('a')));
}

function testPathMap() {
    var ns = recoil.db.ChangeSet;
    var a = ns.Path.fromString('a');
    var ab = ns.Path.fromString('a/b');
    var ab1 = ns.Path.fromString('a/b1');
    var a1 = ns.Path.fromString('a1');
    var testee = new recoil.db.PathMap(schema);

    testee.put(a,1);
    assertSameObjects([1], testee.get(a));
    assertSameObjects([], testee.get(ab));
    testee.put(ab,2);
    assertSameObjects([1,2], testee.get(a));
    assertSameObjects([2], testee.get(ab));
    testee.put(ab1,3);
    assertSameObjects([1,2,3], testee.get(a));
    assertSameObjects([2], testee.get(ab));
    assertSameObjects([1,3], testee.get(a1));

    testee.remove(a);
    assertSameObjects([2,3], testee.get(a));
    assertSameObjects([2], testee.get(ab));
    assertSameObjects([3], testee.get(a1));
};

function testMergeChanges() {
    var ns = recoil.db.ChangeSet;
    var testee = new recoil.db.ChangeDb(schema);
    var fullPath = ns.Path.fromString('full/a');
    var contPath = ns.Path.fromString('test/cont');
    var namedPath = ns.Path.fromString('named-a');
    var listA = ns.Path.fromString('list-a');
    var fullListA = ns.Path.fromString('test/list-a');

    // set operations
    // Set(a), Set(a) -> Set(a)
    assertObjectEquals(
        [new ns.Set(fullListA.setKeys(['k'], [2]).appendName('v'), 20, 200)],
        ns.merge(schema, [
            new ns.Set(fullListA.setKeys(['k'], [2]).appendName('v'), 20, 100),
            new ns.Set(fullListA.setKeys(['k'], [2]).appendName('v'), 100, 200),
        ]));

    // Move(a{1},a{2}), Set(a{2}/b) -> Set(a{1}/b},  Move(a{1},a{2}) TODO
    assertObjectEquals(
        [
            new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'), 20, 200),
            new ns.Move(fullListA.setKeys(['k'], [1]), fullListA.setKeys(['k'],[2]))
        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]), fullListA.setKeys(['k'],[2])),
            new ns.Set(fullListA.setKeys(['k'], [2]).appendName('v'), 20, 200)
        ]));

    
    // multi move
    // Set(a{1}/b),Del(a{1}) -> Del(a{1}})
    // Set(a/b),Del(a) -> Del(a})
    // Add(a{1}),Set(a{1}/b) -> Add(a{1},[Set(a{1}/b])
    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'),undefined, 200)])
        ],
        ns.merge(schema,[
            new ns.Add(fullListA.setKeys(['k'], [1]), []),
            new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'), undefined, 200),
        ]));
    // Add(a{1},[Set(a{1}/b)]),Set(a{1}/b) -> Add(a{1},[Set(a{1}/b])

    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'),undefined, 200)])
        ],
        ns.merge(schema,[
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'),undefined, 20)]),
            new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'), 20, 200),
        ]));

    
    // Add(a),Set(a/b) -> Add(a,[Set(a/b])
    
    assertObjectEquals(
        [
            new ns.Add(contPath.appendName('c1'), [new ns.Set(contPath.appendName('c1').appendName('c2'),undefined, 200)])
        ],
        ns.merge(schema,[
            new ns.Add(contPath.appendName('c1'),[]),
            new ns.Set(contPath.appendNames(['c1','c2']), undefined, 200),
        ]));

    // Add(a{1},[Set(a{1}/b)]),Add(a{1}/c) -> Add(a{1},[Set(a{1}/b, ])

    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]), [
                new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'),undefined, 20),
                new ns.Add(fullListA.setKeys(['k'], [1]).appendName('c'),[])
            ])
        ],
        ns.merge(schema,[
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Set(fullListA.setKeys(['k'], [1]).appendName('v'),undefined, 20)]),
            new ns.Add(fullListA.setKeys(['k'], [1]).appendName('c'), []),
        ]));

    // Move(a{1},a{2}),Add(a{2},[]) -> error
    assertThrows(function () {
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]),fullListA.setKeys(['k'], [2])),
            new ns.Add(fullListA.setKeys(['k'], [2]), []),
        ]);
    });

    
    // Move(a{1},a{2}),Add(a{2}/c,[]) -> // Add(a{1}),Move(a{1},a{2})    

    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]).appendName('c'), []),
            new ns.Move(fullListA.setKeys(['k'], [1]),fullListA.setKeys(['k'], [2])),

        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]),fullListA.setKeys(['k'], [2])),
            new ns.Add(fullListA.setKeys(['k'], [2]).appendName('c'), []),
        ]));

    // delete is ok we should remove it because it may clear out stuff

    assertObjectEquals(
        [
            new ns.Delete(fullListA.setKeys(['k'], [1]), []),
            new ns.Add(fullListA.setKeys(['k'], [1]), [])
        ],
        ns.merge(schema,[
            new ns.Delete(fullListA.setKeys(['k'], [1])),
            new ns.Add(fullListA.setKeys(['k'], [1]), []),
        ]));


    // deletes 
    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]), []),
        ],
        ns.merge(schema,[
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Add(fullListA.setKeys(['k'], [1]).appendName('c'),[])]),
            new ns.Delete(fullListA.setKeys(['k'], [1]).appendName('c'))
        ]));
    assertObjectEquals(
        [
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Delete(fullListA.setKeys(['k'], [1]).appendName('c'))]),         
        ],
        ns.merge(schema,[
            new ns.Add(fullListA.setKeys(['k'], [1]), [new ns.Set(fullListA.setKeys(['k'], [1]).appendName('c').appendName('d'),1,2)]),
            new ns.Delete(fullListA.setKeys(['k'], [1]).appendName('c'))
        ]));
    
    assertObjectEquals(
        [
            new ns.Delete(fullListA.setKeys(['k'], [1])),
        ],
        ns.merge(schema,[
            new ns.Set(fullListA.setKeys(['k'], [1]).appendName('c'), 7, 8),
            new ns.Delete(fullListA.setKeys(['k'], [1]))
        ]));

    // deletes and moves

    assertObjectEquals(
        [
            new ns.Delete(fullListA.setKeys(['k'], [1])),
        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]), fullListA.setKeys(['k'], [2])),
            new ns.Delete(fullListA.setKeys(['k'], [2]))
        ]));

    assertObjectEquals(
        [
            new ns.Delete(fullListA.setKeys(['k'], [1]).appendName('c')),
            new ns.Move(fullListA.setKeys(['k'], [1]), fullListA.setKeys(['k'], [2])),
        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]), fullListA.setKeys(['k'], [2])),
            new ns.Delete(fullListA.setKeys(['k'], [2]).appendName('c'))
        ]));


    assertObjectEquals(
        [
            new ns.Delete(fullListA.setKeys(['k'], [2])),
        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [2]).appendName('c')
                        .setKeys(['k'], [2]),
                        fullListA.setKeys(['k'], [2]).appendName('c')
                        .setKeys(['k'],[1])),
            new ns.Delete(fullListA.setKeys(['k'], [2]))
        ]));

    // move ... move

    assertObjectEquals(
        [
            new ns.Move(fullListA.setKeys(['k'], [1]),fullListA.setKeys(['k'], [3])),
        ],
        ns.merge(schema,[
            new ns.Move(fullListA.setKeys(['k'], [1]),
                        fullListA.setKeys(['k'], [2])),
            new ns.Move(fullListA.setKeys(['k'], [2]),
                        fullListA.setKeys(['k'], [3]))
        ]));


}
