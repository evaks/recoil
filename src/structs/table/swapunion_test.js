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

function checkExpected(tbl, expected) {
    var i = 0;
    assertEquals("length", expected.length, tbl.size());
    tbl.forEach(function (row) {
        var e = expected[i];
        if (e.r !== undefined) {
            assertEquals("A[" + i + "]", e.a === undefined ? e.r : e.a, row.get(COL_A));
            assertEquals("B[" + i + "]", e.b === undefined ? e.r : e.b, row.get(COL_B));
            assertEquals("C[" + i + "]", e.c === undefined ? e.r : e.c, row.get(COL_C));
        }
        else {
            assertEquals("A[" + i + "]", e, row.get(COL_A));
            assertEquals("B[" + i + "]", e, row.get(COL_B));
            assertEquals("C[" + i + "]", e, row.get(COL_C));
        }
        i++;
    });
}

function testWriteTable() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);

    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    var p = 0;
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow(p++);
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    p = 0;
    [-1,-2,-3,-4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow(p++);
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var chooser = function (row) {return row.get(COL_A) < 0 ? 1 : 0;};
    var testee = new recoil.structs.table.SwapUnion([COL_A], chooser);
    
    var expected = [1,2,3,4,-1,-2, -3,-4];
    var i = 0;
    var table = testee.calculate({tables: [ tbl1.freeze(), tbl2.freeze()]});

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
    mtable.set([-1], COL_C, 8);

    var orig = testee.inverse(mtable.freeze(),{tables : [tbl1.freeze(),  tbl2.freeze()]});

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.tables[0].size());
    orig.tables[0].forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });


    checkExpected(orig.tables[1], [{c: 8, r: -1},-2,-3,-4]);


    // test swapping table
    mtable = table.unfreeze();
    mtable.set([1], COL_A, -8);
    mtable.set([-1], COL_A, 8);

    orig = testee.inverse(mtable.freeze(),{tables : [tbl1.freeze(), tbl2.freeze()]});

    checkExpected(orig.tables[0], [2,3,4,{a:8, r:-1}]); // goes to back because comes after last in src
    checkExpected(orig.tables[1], [{a:-8, r:1},-2,-3,-4]);

    table = testee.calculate({tables : [orig.tables[0], orig.tables[1]]});

    checkExpected(table, [{a:-8, r: 1}, 2,3,4,{a:8, r:-1},-2,-3,-4]); // goes to back because comes after last in src

    // check that the table comes back in the same order
}


function testBehaviour() {
    var tbl1 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);
    var tbl2 = new recoil.structs.table.MutableTable([COL_A], [COL_B,COL_C]);

    tbl1.setMeta({left:true});
    tbl1.setColumnMeta(COL_B, {left:true});
    tbl2.setMeta({right:true});
    tbl2.setColumnMeta(COL_B, {right:true});
    var p = 0;
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow(p++);
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl1.addRow(row);
    });

    p = 0;
    [-1,-2,-3,-4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow(p++);
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl2.addRow(row);
    });

    var chooser = function (row) {return row.get(COL_A) < 0 ? 1 : 0;};
    var testee = new recoil.structs.table.SwapUnion([COL_A], chooser);
    var frp = new recoil.frp.Frp();
    var tbl1B = frp.createB(tbl1.freeze());
    var tbl2B = frp.createB(tbl2.freeze());
    var testeeB = recoil.structs.table.SwapUnion.createB([COL_A], chooser, tbl1B,  tbl2B);

    frp.attach(testeeB);
    var expected = [1,2,3,4,-1,-2, -3,-4];
    var i = 0;

    frp.accessTrans(function () {
        var table = testeeB.get();
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
        mtable.set([-1], COL_C, 8);

        testeeB.set(mtable.freeze());
        
    }, testeeB);

    frp.accessTrans(function () {
        checkExpected(tbl1B.get(), [{c: 8, r: 1},2,3,4]);
        checkExpected(tbl2B.get(), [{c: 8, r: -1},-2,-3,-4]);

        var table = testeeB.get();

        var mtable = table.unfreeze();
        mtable.set([1], COL_A, -8);
        mtable.set([-1], COL_A, 8);
        // test swapping table
        testeeB.set(mtable.freeze());
    }, tbl1B, tbl2B, testeeB);


    frp.accessTrans(function () {
        checkExpected(tbl1B.get(), [2,3,4,{a:8, r:-1, c:8}]); // goes to back because comes after last in src
        checkExpected(tbl2B.get(), [{a:-8, r:1, c: 8},-2,-3,-4]);

        var table = testeeB.get();

        checkExpected(table, [{a:-8, r: 1, c: 8}, 2,3,4,{a:8, r:-1, c:8},-2,-3,-4]); // goes to back because comes after last in src
    }, tbl1B, tbl2B, testeeB);
    // check that the table comes back in the same order
}



