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
    assertEquals(expected.length, tbl.size());
    tbl.forEach(function (row) {
        var e = expected[i];
        if (e.r !== undefined) {
            assertEquals(e.a === undefined ? e.r : e.a, row.get(COL_A));
            assertEquals(e.b === undefined ? e.r : e.b, row.get(COL_B));
            assertEquals(e.c === undefined ? e.r : e.c, row.get(COL_C));
        }
        else {
            assertEquals(e, row.get(COL_A));
            assertEquals(e, row.get(COL_B));
            assertEquals(e, row.get(COL_C));
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
    mtable.set([-1], COL_C, 8);

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


    checkExpected(orig.table2, [{c: 8, r: -1},-2,-3,-4]);


    // test swapping table
    mtable = table.unfreeze();
    mtable.set([1], COL_A, -8);
    mtable.set([-1], COL_A, 8);

    orig = testee.inverse(mtable.freeze(),{table1 : tbl1.freeze(), table2: tbl2.freeze()});

    checkExpected(orig.table1, [2,3,4,{a:8, r:-1}]); // goes to back because comes after last in src
    checkExpected(orig.table2, [{a:-8, r:1},-2,-3,-4]);

    table = testee.calculate({table1 : orig.table1, table2 : orig.table2});

    checkExpected(table, [{a:-8, r: 1}, 2,3,4,{a:8, r:-1},-2,-3,-4]); // goes to back because comes after last in src

    // check that the table comes back in the same order
}




