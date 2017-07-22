goog.provide('recoil.db.CacheTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.db.Cache');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.db.CacheTest');

function testIt() {
    var frp = new recoil.frp.Frp();
    var b = frp.createNotReadyB();
    var c = frp.createNotReadyB();
    var cache = new recoil.db.Cache('v1');
    cache.clear();
    var cachedB = cache.get("key1", b);

    frp.attach(cachedB);
    assertObjectEquals(recoil.frp.BStatus.notReady(), cachedB.unsafeMetaGet());
    frp.accessTrans(function () {
        b.set({a:1});
    },b );
    assertObjectEquals({a:1}, cachedB.unsafeMetaGet().get());
    frp.accessTrans(function () {
        cachedB.set({a:2});
    }, cachedB);
    assertObjectEquals({a:2}, cachedB.unsafeMetaGet().get());
    
    var cached1B = cache.get("key1", c);
    frp.attach(cached1B);
    console.log(cached1B.unsafeMetaGet().get());
    assertObjectEquals({a:2}, cached1B.unsafeMetaGet().get());
    

//    assertObjectEquals({a:1}, cachedB.unsafeMetaGet().get());

    
    
}


