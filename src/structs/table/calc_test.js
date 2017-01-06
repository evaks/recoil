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
    return 
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
    testee.removeCol(COL_Y);

    var res = testee.calc(makeTable(tableRaw));

    assertObjectEquals(makeTable(expectedRaw), res);
    assertObjectEquals(makeTable(tableRaw), testee.inverse(res, makeTable(tableRaw));
    

    
}
