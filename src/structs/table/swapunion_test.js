goog.provide('recoil.structs.table.SwapUnionTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.SwapUnion');
goog.require('recoil.util');
goog.require('recoil.structs.table.ColumnKey');




goog.setTestOnly('recoil.structs.table.SwapUnionTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_C = new recoil.structs.table.ColumnKey("c");
var COL_D = new recoil.structs.table.ColumnKey("d");
var COL_E = new recoil.structs.table.ColumnKey("e");

function testWriteTable() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);

    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    [5,6,7,8].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var testee = new recoil.structs.table.SwapUnion(true,false);
    
    var expected = [1,2,3,4,5,6,7,8];
    var i = 0;
    var table = testee.calculate({table1 : tbl1.freeze(), table2 : tbl2.freeze()});

    assertObjectEquals({left: true, right : true}, table.getMeta());
    assertObjectEquals({left: true, right : true}, table.getColumnMeta(COL_B));
    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set([1], COL_C, 8);
    mtable.set([5], COL_C, 8);

    var orig = testee.inverse(mtable.freeze(),{table1 : tbl1.freeze(), table2: tbl2.freeze()});

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.table1.size());
    orig.table1.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });


    expected = [5,6,7,8];
    i = 0;
    assertEquals(expected.length, orig.table2.size());
    orig.table2.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });
    
}


function testConcatKey() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var srcCol =  new recoil.structs.table.ColumnKey('$src', undefined, undefined,  /** @type {Array<number>?}*/(null));
    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val + '');
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val + '');
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var testee = new recoil.structs.table.SwapUnion(true,false, srcCol, [':0',':1']);
    
    var expected = [
        {v: 1, k: '1:0'},{v: 1, k: '1:1'},
        {v: 2, k: '2:0'},{v: 2, k: '2:1'},
        {v: 3, k: '3:0'},{v: 3, k: '3:1'},
        {v: 4, k: '4:0'},{v: 4, k: '4:1'}];
    var i = 0;
    var table = testee.calculate({table1 : tbl1.freeze(), table2 : tbl2.freeze()});

    assertObjectEquals({left: true, right : true}, table.getMeta());
    assertObjectEquals({left: true, right : true}, table.getColumnMeta(COL_B));
    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i].k, row.get(COL_A));
        assertEquals(expected[i].v, row.get(COL_B));
        assertEquals(expected[i].v, row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set(['1:0'], COL_C, 7);
    mtable.set(['1:1'], COL_C, 8);

    var orig = testee.inverse(mtable.freeze(),{table1 : tbl1.freeze(), table2: tbl2.freeze()});

    expected = [
        {v: 1, k: '1', c: 7},
        {v: 2, k: '2'},
        {v: 3, k: '3'},
        {v: 4, k: '4'}];
    i = 0;
    var checkExpected = function (row) {
        assertEquals(expected[i].k, row.get(COL_A));
        assertEquals(expected[i].v, row.get(COL_B));
        if (expected[i].c) {
            assertEquals(expected[i].c, row.get(COL_C));
        }
        else {
            assertEquals(expected[i].v, row.get(COL_C));
        }
        i++;
    };
    assertEquals(expected.length, orig.table1.size());
    orig.table1.forEach(checkExpected);

    expected = [
        {v: 1, k: '1', c: 8},
        {v: 2, k: '2'},
        {v: 3, k: '3'},
        {v: 4, k: '4'}];
    i = 0;
    assertEquals(expected.length, orig.table2.size());
    orig.table2.forEach(checkExpected);
    
}

function testRemoveDupes() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);

    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var testee = new recoil.structs.table.SwapUnion(true,true);
    
    var expected = [1,2,3,4];
    var i = 0;
    var table = testee.calculate({table1 : tbl1.freeze(), table2 : tbl2.freeze()});

    assertObjectEquals({left: true, right : true}, table.getMeta());
    assertObjectEquals({left: true, right : true}, table.getColumnMeta(COL_B));
    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set([1], COL_C, 8);

    var orig = testee.inverse(mtable.freeze(),{table1 : tbl1.freeze(), table2: tbl2.freeze()});

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.table1.size());
    orig.table1.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });


    i = 0;
    assertEquals(expected.length, orig.table2.size());
    orig.table2.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });
    
}

function testAllowDupes() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);

    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var testee = new recoil.structs.table.SwapUnion(false, false);
    
    var expected = [1,2,3,4,1,2,3,4];
    var i = 0;
    var table = testee.calculate({table1 : tbl1.freeze(), table2 : tbl2.freeze()});

    assertObjectEquals({left: true, right : true}, table.getMeta());
    assertObjectEquals({left: true, right : true}, table.getColumnMeta(COL_B));
    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set([0], COL_C, 8);
    mtable.set([4], COL_C, 10);

    var orig = testee.inverse(mtable.freeze(),{table1 : tbl1.freeze(), table2: tbl2.freeze()});

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.table1.size());
    orig.table1.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });


    i = 0;
    assertEquals(expected.length, orig.table2.size());
    orig.table2.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 10 : expected[i], row.get(COL_C));
        i++;
    });
    
}


