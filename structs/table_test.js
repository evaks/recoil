goog.provide('recoil.structs.TableTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.Table');



goog.setTestOnly('recoil.structs.TableTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_C = new recoil.structs.table.ColumnKey("c");


function testAddRow() {
    var tbl = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var row = new recoil.structs.table.MutableTableRow();
    row.set(COL_A, "hello");
    row.set(COL_B, "world");
    
    tbl.addRow(row);
    
    assertEquals("hello",tbl.get(0, COL_A));
    assertEquals("world",tbl.get(0, COL_B));

    var table = tbl.freeze();
    
    assertEquals("hello",table.get(0, COL_A));
    assertEquals("world",table.get(0, COL_B));
    

}

function testAddIncompleteRow() {
    assertTrue(false);
}
function testRemoveRow() {
    assertTrue(false);
}

function testChangeCell() {
    assertTrue(false);
}
function testImmutableTable() {
    assertTrue(false);
}

function testComplexPrimaryKey() {
    assertTrue(false);
}
function testImmutableRow() {
    assertTrue(false);
}

function testColKeyComparator() {
    assertTrue(false);
}



