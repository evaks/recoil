goog.provide('recoil.structs.TableTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.Table');



goog.setTestOnly('recoil.structs.TableTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_C = new recoil.structs.table.ColumnKey("c");
var COL_D = new recoil.structs.table.ColumnKey("d", function (x, y) {
   return  y - x;
});


function testAddRow() {
    var tbl = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var row = new recoil.structs.table.MutableTableRow();
    row.set(COL_A, "hello");
    row.set(COL_B, "world");
    
    tbl.addRow(row);
    
    assertEquals("hello",tbl.get([0], COL_A));
    assertEquals("world",tbl.get([0], COL_B));

    var table = tbl.freeze();
    
    assertEquals("hello",table.get([0], COL_A));
    assertEquals("world",table.get([0], COL_B));
}

function testAddIncompleteRow() {
    var tbl = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var row = new recoil.structs.table.MutableTableRow();
    var tblPk = new recoil.structs.table.MutableTable([COL_A], [COL_B]);

    row.set(COL_B, "world");

    assertThrows(function() {
	tbl.addRow(row);
    });
    
    assertThrows(function() {
	tblPk.addRow(row);
    });

    row.set(COL_A, "hello");
    tbl.addRow(row);
    tblPk.addRow(row);

    assertEquals("hello",tbl.get([0], COL_A));
    assertEquals("world",tbl.get([0], COL_B));
    assertNull(tbl.get([0], COL_C));
    
    assertEquals("world",tblPk.get(["hello"], COL_B));
    
    row.set(COL_C, "!");

    tbl.addRow(row);
    assertNull(tbl.get([1], COL_C));
    assertEquals("world",tbl.get([1], COL_B));
}

function testImmutableRow() {
    var tbl = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var row = new recoil.structs.table.MutableTableRow();
    row.set(COL_A, "hello");
    row.set(COL_B, "world");

    tbl.addRow(row);

    assertEquals("hello",row.get(COL_A));
    assertEquals("world",row.get(COL_B));

    var row2 = row.freeze();

    row.set(COL_A, "pinky");
    assertEquals("pinky",row.get(COL_A));

    row2.set(COL_A, "smurf");
    assertEquals("hello",row2.get( COL_A));

}

function testRemoveRow() {
    var mTable = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var tblRow = recoil.structs.table.TableRow;

    mTable.addRow(tblRow.create(COL_A, 1, COL_B, 8));
    mTable.addRow(tblRow.create(COL_A, 7, COL_B, 9));

    assertEquals(1, mTable.get([0], COL_A));
    mTable.removeRow([COL_A]);
    assertNull(mTable.get([0], COL_A));


}

function testImmutableTable() {

    var mTable = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var tblRow = recoil.structs.table.TableRow;

    mTable.addRow(tblRow.create(COL_A, 1, COL_B, 8));
    mTable.addRow(tblRow.create(COL_A, 7, COL_B, 9));

    var table = mTable.freeze();

    assertEquals(1, table.get([0], COL_A));
    mTable.set([0], COL_A, 3);
    assertEquals(1, table.get([0], COL_A));
    assertEquals(3, mTable.get([0], COL_A));

}

function testChangeCell() {
    var mTable = new recoil.structs.table.MutableTable([], [COL_A]);
    var row = new recoil.structs.table.MutableTableRow();

    row.set(COL_A, "hello");

    mTable.addRow(row);

    assertEquals("hello",row.get(COL_A));

    var cell = new recoil.structs.table.TableCell("bobo", { color: 'red'});
    row.setCell(COL_A, cell);

    assertEquals("bobo",row.get(COL_A));
    assertEquals('red', row.getCell(COL_A).getMeta().color);

    var cell2 = cell.setMeta({color: 'blue'});
    assertEquals("blue", cell2.getMeta().color);

    row.set(COL_A, "fish");
    assertEquals("fish",row.get(COL_A));
}

function testColKeyComparator() {
    var orderdTable = new recoil.structs.table.MutableTable([COL_A], [COL_B]);
    var revTable = new recoil.structs.table.MutableTable([COL_D], [COL_B]);
    var rowF = recoil.structs.table.TableRow;

    orderdTable.addRow(rowF.create(COL_A, 7, COL_B, 9));
    orderdTable.addRow(rowF.create(COL_A, 1, COL_B, 8));

    revTable.addRow(rowF.create(COL_D, 1, COL_B, 8));
    revTable.addRow(rowF.create(COL_D, 7, COL_B, 9));


    var expected = [{a:1, b: 8}, {a:7, b: 9}];
    var i = 0;
    orderdTable.freeze().forEach(function (row) {
        assertEquals(expected[i].a, row.get(COL_A));
        assertEquals(expected[i].b, row.get(COL_B));
        i++;
    });

    assertEquals(i, expected.length);

    var i = 0;
    orderdTable.forEach(function (row) {
        assertEquals(expected[i].a, row.get(COL_A));
        assertEquals(expected[i].b, row.get(COL_B));
        i++;
    });
    assertEquals(i, expected.length);

    expected = [{d:7, b: 9}, {d:1, b: 8}];

    i = 0;
    revTable.freeze().forEach(function (row) {
        assertEquals(expected[i].d, row.get(COL_D));
        assertEquals(expected[i].b, row.get(COL_B));
        i++;
    });

    assertEquals(i, expected.length);

    i = 0;
    revTable.forEach(function (row) {
        assertEquals(expected[i].d, row.get(COL_D));
        assertEquals(expected[i].b, row.get(COL_B));
        i++;
    });

    assertEquals(i, expected.length);

    //assertTrue(false);
    /*
     table.getMeta([1], COL_A);

    table.setTableMeta({name : 'foo'});
    table.setCell([0], COL_A, new recoil.structs.table.TableCell('hi', {color : 'red'}))
    assertEquals({name: 'foo', color : 'red'}, table.getMeta([0],COL_A));*/
}

function testGetNonExistantRow() {
    assertTrue(false);
}

function testDuplicateRow() {
    assertTrue(false);
}

function testComplexPrimaryKey() {
    assertTrue(false);
}

function testForEach() {
    var mTable = new recoil.structs.table.MutableTable([], [COL_A, COL_B]);
    var rowF = recoil.structs.table.TableRow;

    mTable.addRow(rowF.create(COL_A, 1, COL_B, 8));
    mTable.addRow(rowF.create(COL_A, 7, COL_B, 9));

    var table = mTable.freeze();

    var i = 0;
    table.forEach(function (r) {
        assertTrue(recoil.util.isEqual(mTable.getRow([i]), r));
        i++;
    });
    assertEquals(2, i);
}
