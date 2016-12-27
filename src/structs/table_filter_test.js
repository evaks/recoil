goog.provide('recoil.structs.table.FilterTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.Filter');
goog.require('recoil.util');
goog.require('recoil.structs.table.ColumnKey');




goog.setTestOnly('recoil.structs.TableTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_C = new recoil.structs.table.ColumnKey("c");
var COL_D = new recoil.structs.table.ColumnKey("d");
var COL_E = new recoil.structs.table.ColumnKey("e");

function odd(row) {
    return row.get(COL_B) % 2 == 1;
}
function testReplace() {
    var tbl = new recoil.structs.table.MutableTable([COL_A], [COL_B, COL_C]);

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl.addRow(row);
    });

    var testee = new recoil.structs.table.Filter();
    
    var expected = [1,3];
    var i = 0;
    var table = testee.calculate({table : tbl.freeze(), filter : odd});

    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set([1], COL_C, 8);

    var orig = testee.inverse(mtable.freeze(),{table : tbl.freeze(), filter: odd});

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.table.size());
    orig.table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(i == 0 ? 8 : expected[i], row.get(COL_C));
        i++;
    });
    
}

function testDelete () {
    var tbl = new recoil.structs.table.MutableTable([COL_A], [COL_B, COL_C]);

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl.addRow(row);
    });

    var testee = new recoil.structs.table.Filter();
    
    var expected = [1,3];
    var i = 0;
    var table = testee.calculate({table : tbl.freeze(), filter : odd});

    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.removeRow([3]);

    var orig = testee.inverse(mtable.freeze(),{table : tbl.freeze(), filter: odd});

    expected = [1,2,4];
    i = 0;
    assertEquals(expected.length, orig.table.size());
    orig.table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });
    
}

function testInsert () {
    var tbl = new recoil.structs.table.MutableTable([COL_A], [COL_B, COL_C]);

    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, val);
        row.set(COL_B, val);
        row.set(COL_C, val);
        tbl.addRow(row);
    });

    var testee = new recoil.structs.table.Filter();
    
    var expected = [1,3];
    var i = 0;
    var table = testee.calculate({table : tbl.freeze(), filter : odd});

    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();

    var row = new recoil.structs.table.MutableTableRow();
    row.set(COL_A, 5);
    row.set(COL_B, 5);
    row.set(COL_C, 5);
    mtable.addRow(row);


    var orig = testee.inverse(mtable.freeze(),{table : tbl.freeze(), filter: odd});

    expected = [1,2,3,4,5];
    i = 0;
    assertEquals(expected.length, orig.table.size());
    orig.table.forEach(function (row) {
        assertEquals(expected[i], row.get(COL_A));
        assertEquals(expected[i], row.get(COL_B));
        assertEquals(expected[i], row.get(COL_C));
        i++;
    });
    
}
