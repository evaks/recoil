goog.provide('recoil.util.mapTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.util.map');

goog.setTestOnly('recoil.util.mapTest');


function testRecSafeGet() {
        var ns = recoil.util.map;
    var map = {};
    assertTrue(undefined === ns.safeRecGet(map, ['a','b','c']));
    assertTrue(undefined === ns.safeRecGet({}, ['a','b']));
    
    
}
function testRecSafeGetRemove() {
    var ns = recoil.util.map;
    var map = {};
    var val = ns.safeRecGet(map, ['a','b','c'],{count:0});
    var removeFunc = function (v) {
        v.count--;
        return v.count === 0;
    };
    
    assertObjectEquals({count:0},val);
    assertObjectEquals({a:{b:{c:{count:0}}}},map);
    val.count++;
    val.count++;
    assertObjectEquals({a:{b:{c:{count:2}}}},map);
    ns.safeRecGet(map, ['a','b1','c'],{count:2});
    assertObjectEquals({a:{b:{c:{count:2}},b1:{c:{count:2}}}},map);
    ns.safeRecRemove(map, ['a','b','c'],removeFunc);
    assertObjectEquals({a:{b:{c:{count:1}},b1:{c:{count:2}}}},map);
    ns.safeRecRemove(map, ['a','b','c'],removeFunc);
    assertObjectEquals({a:{b1:{c:{count:2}}}},map);
    ns.safeRecRemove(map, ['a','b','c'],removeFunc);
    assertObjectEquals({a:{b1:{c:{count:2}}}},map);
    ns.safeRecRemove(map, ['a','b1','c'],removeFunc);
    assertObjectEquals({a:{b1:{c:{count:1}}}},map);
    ns.safeRecRemove(map, ['a','b1','c'],removeFunc);
    assertObjectEquals({},map);

}


