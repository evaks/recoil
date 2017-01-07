goog.provide('recoil.structs.table.CalcTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.CalcTable');

goog.setTestOnly('recoil.structs.table.CalcTest');

var COLS = {
    x_p : new recoil.structs.table.ColumnKey("x_p"),
    x : new recoil.structs.table.ColumnKey("x"),
    y : new recoil.structs.table.ColumnKey("y"),
    z : new recoil.structs.table.ColumnKey("z")
}

function makeTable(raw) {
    var pks = [];
    var other = [];
 

    var row = raw[0];
    for (var k in row) {
        if (k.endsWith('_p')) {
            pks.push(COLS[k]);
        }
        else {
            other.push(COLS[k]);
        }
    }
    
    var res  = new recoil.structs.table.MutableTable(pks, other);
    for (var i = 0; i < raw.length; i++) {
        row = raw[i];
        var newRow = new recoil.structs.table.MutableTableRow();
        for (var k in row) {
            newRow.set(COLS[k], row[k]);
        }
        res.addRow(newRow);
    }    
    return res.freeze(); 
} 
function checkTable (expected, table) {
    var expectedTable = makeTable(expected);
    var orderedRows = [];

    assertEquals(expectedTable.size(), table.size());
    
    expectedTable.forEach(function (row) {
        orderedRows.push(row);
    });

    var i = 0;

    table.forEach(function (row) {
        var expectedRow = orderedRows[i];

        expectedTable.getColumns().forEach(function (col) {
            assertObjectEquals("row " + i + " col " + col, expectedRow.get(col), row.get(col));
        });
        i++;
    });
    
    
}

function testRemoveCol () {
    var tableRaw = [
        {x_p : 1, y : 2, z: 3},
        {x_p : 2, y : 2, z: 3},
        {x_p : 3, y : 2, z: 3}];

    var expectedRaw = [
        {x_p : 1, z: 3},
        {x_p : 2, z: 3},
        {x_p : 3, z: 3}];

    var testee = new recoil.structs.table.CalcTable();
    testee.removeCol(COLS.y);

    var res = testee.calculate(makeTable(tableRaw));
    var expected = makeTable(expectedRaw);
    
    checkTable(expectedRaw,res);
    assertObjectEquals(makeTable(tableRaw), testee.inverse(res, makeTable(tableRaw)));
    

    
}

function testAddCol () {
    var tableRaw = [
        {x_p : 1, y : 2, z: 3},
        {x_p : 2, y : 2, z: 3},
        {x_p : 3, y : 2, z: 3}];

    var expectedRaw = [
        {x_p : 1, x: 2, y: 2, z: 3},
        {x_p : 2, x: 2, y: 2, z: 3},
        {x_p : 3, x: 2, y: 2, z: 3}];
    
    var expectedOutRaw = [
        {x_p : 1, y : 2, z: 3},
        {x_p : 2, y : 10, z: 3},
        {x_p : 3, y : 2, z: 3}];

    var testee = new recoil.structs.table.CalcTable();
    testee.addCol(COLS.x, COLS.y, function (v) {return v;}, function (v) {return v;}, {fish:true});

    var res = testee.calculate(makeTable(tableRaw));
    var expected = makeTable(expectedRaw);
    
    checkTable(expectedRaw,res);
    assertObjectEquals({fish:true}, res.getColumnMeta(COLS.x));
    var mres = res.unfreeze();
    mres.set([2], COLS.x, 10);

    
    assertObjectEquals(makeTable(expectedOutRaw), testee.inverse(mres.freeze(), makeTable(tableRaw)));
    
    mres = res.unfreeze();
    mres.set([2], COLS.y, 10);

    assertObjectEquals(makeTable(expectedOutRaw), testee.inverse(mres.freeze(), makeTable(tableRaw)));
    
}

function testAddRow() {
    var tableRaw = [
        {x_p : 1, y : 2, z: 3},
        {x_p : 2, y : 2, z: 3},
        {x_p : 3, y : 2, z: 3}];

    var expectedRaw = [
        {x_p : 1, x: 2, y: 2, z: 3},
        {x_p : 2, x: 2, y: 2, z: 3},
        {x_p : 3, x: 2, y: 2, z: 3}];
    
    var expectedOutRaw = [
        {x_p : 1, y : 2, z: 3},
        {x_p : 2, y : 2, z: 3},
        {x_p : 3, y : 2, z: 3},
        {x_p : 4, y : 5, z: 5}];

    var testee = new recoil.structs.table.CalcTable();
    testee.addCol(COLS.x, COLS.y, function (v) {return v;}, function (v) {return v;}, {fish:true});

    var res = testee.calculate(makeTable(tableRaw));
    var expected = makeTable(expectedRaw);
    
    checkTable(expectedRaw,res);
    assertObjectEquals({fish:true}, res.getColumnMeta(COLS.x));
    var mres = res.unfreeze();
    var row = new recoil.structs.table.MutableTableRow();
    row.set(COLS.x_p, 4);
    row.set(COLS.x, 5);
    row.set(COLS.y, 5);
    row.set(COLS.z, 5);
    
    mres.addRow(row);

    assertObjectEquals(makeTable(expectedOutRaw), testee.inverse(mres.freeze(), makeTable(tableRaw)));
    
};


