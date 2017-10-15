goog.provide('recoil.frp.structTest');


goog.require('goog.testing.jsunit');
goog.require('recoil.frp.struct');


goog.setTestOnly('recoil.frp.structTest');

function testGetMeta() {
    var frp = new recoil.frp.Frp();

    var valB = frp.createB({a:1, b: recoil.frp.BStatus.notReady(), c: new recoil.frp.BStatus(3)});
    var aB = recoil.frp.struct.getMeta('a', valB);
    var bB = recoil.frp.struct.getMeta('b', valB);
    var cB = recoil.frp.struct.getMeta('c', valB);

    frp.attach(aB);
    frp.attach(bB);
    frp.attach(cB);

    frp.accessTrans(
        function () {
            assertEquals(1, aB.get());
            assertEquals(false, bB.metaGet().ready());
            assertEquals(3, cB.get());

            aB.set(11);
            bB.set(12);
            cB.set(13);
            
        }, aB,bB,cB);

        frp.accessTrans(
        function () {
            assertEquals(11, aB.get());
            assertEquals(12, bB.get());
            assertEquals(13, cB.get());

        }, aB,bB,cB, valB);
}

function testFlattenMeta() {
    var frp = new recoil.frp.Frp();
    var aB = frp.createB('a');
    var bB = frp.createNotReadyB();
    var daB = frp.createB('da');
    var dbB = frp.createNotReadyB();
    var listA = frp.createB('listA');
    var listB = frp.createNotReadyB();

    var valB = recoil.frp.struct.flattenMeta(frp, {a: aB, b:bB, c:'c', d: {a:daB, b: dbB, c:'dc'}, list:[1, listA, listB]});

    function bs(v) {
        return new recoil.frp.BStatus(v);
    }
    frp.attach(valB);

    frp.accessTrans(function () {
        assertTrue(valB.good());
        var nr = recoil.frp.BStatus.notReady();
        assertObjectEquals({a: new recoil.frp.BStatus('a'),
                            b:nr, c:'c', d: {
                                a:new recoil.frp.BStatus('da'), b: nr, c:'dc'}, list:[1, new recoil.frp.BStatus('listA'), nr]},valB.get());

        valB.set({a: 'a1',
                            b:'b1', c:'c1', d: {
                                a:'da1', b: 'db1', c:'dc'}, list:[1, 'listA1', 'listB1']},valB.get());
        
    }, valB);

    frp.accessTrans(function () {
        assertEquals('a1', aB.get());
        assertEquals('b1', bB.get());
        assertEquals('da1', daB.get());
        assertEquals('db1', dbB.get());

        assertEquals('listA1', listA.get());
        assertEquals('listB1', listB.get());

        assertObjectEquals({a: new recoil.frp.BStatus('a1'),
                            b:bs('b1'), c:'c', d: {
                                a:bs('da1'), b: bs('db1'), c:'dc'}, list:[1, bs('listA1'), bs('listB1')]},valB.get());
        
        valB.set({a: bs('a2'),
                            b:'b1', c:'c1', d: {
                                a:bs('da2'), b: 'db1', c:'dc'}, list:[1, 'listA1', 'listB1']},valB.get());
    },aB, bB, daB, dbB, listA, listB, valB);


    frp.accessTrans(function () {
        assertEquals('a2', aB.get());
        assertEquals('b1', bB.get());
        assertEquals('da2', daB.get());
        assertEquals('db1', dbB.get());

        assertEquals('listA1', listA.get());
        assertEquals('listB1', listB.get());

        assertObjectEquals({a: new recoil.frp.BStatus('a2'),
                            b:bs('b1'), c:'c', d: {
                                a:bs('da2'), b: bs('db1'), c:'dc'}, list:[1, bs('listA1'), bs('listB1')]},valB.get());
        
    },aB, bB, daB, dbB, listA, listB, valB);
}

