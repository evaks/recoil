goog.provide('recoil.structs.table.MapColumnsTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.MapColumns');
goog.require('recoil.util');
goog.require('recoil.structs.table.ColumnKey');




goog.setTestOnly('recoil.structs.table.MapColumnsTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_C = new recoil.structs.table.ColumnKey("c");
var COL_D = new recoil.structs.table.ColumnKey("d");
var COL_E = new recoil.structs.table.ColumnKey("e");


function odd(row) {
    return row.get(COL_B) % 2 == 1;
}
function testSet() {
    var tbl = new recoil.structs.table.MutableTable([COL_A], [COL_B, COL_C]);

    tbl.setMeta({left:true});
    tbl.setColumnMeta(COL_B, {left:true});
    tbl.setColumnMeta(COL_C, {left:true});
    [1,2,3,4].forEach(function (val) {
        var row = new recoil.structs.table.MutableTableRow();
        row.set(COL_A, "a" + val);
        row.set(COL_B, "b" + val);
        row.set(COL_C, "c" + val);
        tbl.addRow(row);
    });

    var testee = new recoil.structs.table.MapColumns();
    
    var expected = [1,2,3,4];
    var i = 0;
    var mappings = [{from :COL_A, to:COL_D},{from :COL_C, to: COL_E}];
    var table = testee.calculate({table : tbl.freeze(), mappings :mappings});

    assertObjectEquals({left: true}, table.getMeta());
    assertObjectEquals({left: true}, table.getColumnMeta(COL_B));
    assertObjectEquals({left: true}, table.getColumnMeta(COL_E));
    assertEquals(expected.length, table.size());

    table.forEach(function (row) {
        assertEquals("a" + expected[i], row.get(COL_D));
        assertEquals("b" + expected[i], row.get(COL_B));
        assertEquals("c" + expected[i], row.get(COL_E));
        assertEquals(null, row.get(COL_A));
        assertEquals(null, row.get(COL_C));
        i++;
    });

    var mtable = table.unfreeze();
    mtable.set(["a3"], COL_B, "b8");
    mtable.set(["a3"], COL_E, "e8");
    mtable.setMeta({left:false});
    mtable.setColumnMeta(COL_B, {left:false});
    mtable.setColumnMeta(COL_E, {left:false});

    var orig = testee.inverse(mtable.freeze(),{table : tbl.freeze(), mappings: mappings});


    assertObjectEquals({left: false}, orig.table.getMeta());
    assertObjectEquals({left: false}, orig.table.getColumnMeta(COL_B));
    assertObjectEquals({left: false}, orig.table.getColumnMeta(COL_C));

    expected = [1,2,3,4];
    i = 0;
    assertEquals(expected.length, orig.table.size());
    orig.table.forEach(function (row) {
        assertEquals("a" + expected[i], row.get(COL_A));
        assertEquals (i === 2 ? "e8" : "c" +  expected[i], row.get(COL_C));
        assertEquals(i == 2 ? "b8" : "b" + expected[i], row.get(COL_B));
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

    var testee = new recoil.structs.table.MapColumns();
    
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
