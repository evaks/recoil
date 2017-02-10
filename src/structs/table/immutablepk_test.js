goog.provide('recoil.structs.table.ImmutablePkTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.ImmutablePk');
goog.require('recoil.util');
goog.require('recoil.structs.table.ColumnKey');



goog.setTestOnly('recoil.structs.table.ImmutablePkTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");


function checkTable(expected, table, mappings, dupsCol) {
    assertEquals(expected.length, table.size());
    var idMap = {};
    var pos = 0;
    table.forEach(function (tblRow, keys) {
        var row = expected[pos];
        assertEquals("a.value [" + pos + "]", row.a.val, tblRow.get(COL_A));
        assertEquals("b.value [" + pos + "]", row.b.val, tblRow.get(COL_B));
        assertObjectEquals("a.meta [" + pos + "]",row.a.meta, tblRow.getCellMeta(COL_A));
        assertObjectEquals("b.meta [" + pos + "]",row.b.meta, tblRow.getCellMeta(COL_B));

        if (row.id !== undefined) {
            assertEquals("id [" + pos + "]", row.id, tblRow.get(table.getPrimaryColumns()[0]));
        }

        if (row.dups !== undefined) {
            assertObjectEquals("dups [" + pos + "]", row.dups, tblRow.get(dupsCol));
        }

        if (mappings[row.a.val] !== undefined) {
            assertEquals("mapping [" + pos + "]", mappings[row.a.val], keys[0]);
        }
        idMap[row.a.val] = keys[0];
        
        pos++;
    });
    // map from origkey to immutable key
    return idMap;
}
var mkTable = function (rows) {
    var tbl = new recoil.structs.table.MutableTable([COL_A], [COL_B]);
    tbl.setMeta({tableMeta:true});
    
    tbl.setColumnMeta(COL_A, {meta:"a"});
    tbl.setColumnMeta(COL_B, {meta:"b"});
    
    var pos = 0;
    
    var genRow = function (val) {
        var row = new recoil.structs.table.MutableTableRow(pos++);
        row.set(COL_A, val);
        row.setCellMeta(COL_A, {cell : "a" + val});
            row.set(COL_B, "b" + val);
        row.setCellMeta(COL_B, {cell : "b" + val});
        tbl.addRow(row);
    };
    rows.forEach(genRow);
    return tbl;
};

function testImmutablePk() {

    var testee = new recoil.structs.table.ImmutablePk();
    var tbl = new mkTable([2,3,4,1]);
    var table = testee.calculate({table : tbl.freeze()});

    assertObjectEquals({tableMeta: true}, table.getMeta());
    
    var expected = [
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}}},
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},

    ];


    var mappings = checkTable (expected, table, {});
    var origTable = mkTable([5,1,2,3,4]).freeze();
    table = testee.calculate({table : origTable});
    
    expected = [
        {a: {val: 5, meta: {cell : "a5"}}, b: {val:"b5",  meta : {cell : "b5"}}},
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}}},

    ];

    mappings = checkTable (expected, table, mappings);

    // now test adding a row

    var mtable = table.unfreeze();

    var row = recoil.structs.table.Table.createUniqueIntPkRow(mtable);
    row.set(COL_A, 6);
    row.set(COL_B, "b6");
    mtable.addRow(row);
    mtable.set([mappings[3]],COL_B, "b3new"); 
    
    expected = [
        {a: {val: 5, meta: {cell : "a5"}}, b: {val:"b5",  meta : {cell : "b5"}}},
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3new",  meta : {cell : "b3"}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}}},
        {a: {val: 6, meta: {}}, b: {val:"b6",  meta : {}}},
    ];
    var res = testee.inverse(mtable.freeze(), {table:origTable});
    checkTable (expected, res.table, {});

    // check keeps new keys unchanged
    
}



function testNewKeyUnchanged() {

    var testee = new recoil.structs.table.ImmutablePk();
    var tbl = new mkTable([1]);
    var table = testee.calculate({table : tbl.freeze()});
    var mtable = table.unfreeze();
    
    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
        {a: {val: 6, meta: {}}, b: {val:"b6",  meta : {}}},

    ];

    var row = recoil.structs.table.Table.createUniqueIntPkRow(mtable);
    row.set(table.getPrimaryColumns()[0], 100);
    row.set(COL_A, 6);
    row.set(COL_B, "b6");
    mtable.addRow(row);

    var res = testee.inverse(mtable.freeze(), {table:tbl.freeze()});
    checkTable (expected, res.table, {});
    checkTable (expected, testee.calculate({table: res.table}), {6:100});
}

function testNewKeyDup() {

    var testee = new recoil.structs.table.ImmutablePk();
    var tbl = new mkTable([1]);
    var table = testee.calculate({table : tbl.freeze()});
    var mtable = table.unfreeze();
    
    var expectedSrc = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}}
    ];

    var mappings = checkTable (expectedSrc, table, {});
    var expectedDest = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}, dups: [100]}},
        {a: {val: 1, meta: {}}, b: {val:"b6",  meta : {}}, dups: [mappings[1]]},

    ];

    var row = recoil.structs.table.Table.createUniqueIntPkRow(mtable);
    row.set(table.getPrimaryColumns()[0], 100);
    row.set(COL_A, 1);
    row.set(COL_B, "b6");
    mtable.addRow(row);

    var res = testee.inverse(mtable.freeze(), {table:tbl.freeze()});
    checkTable (expectedSrc, res.table, {});
    table  =testee.calculate({table: res.table});
    checkTable (expectedDest, table,{6:100},testee.DUPLICATES);

    // test removing a row
    mtable = table.unfreeze();
    mtable.removeRow([100]);
    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"},  id:mappings[1], dups:[]}},
    ];
    res = testee.inverse(mtable.freeze(), {table:res.table});
    checkTable (expected, res.table, {});
    table = testee.calculate({table: res.table});
    checkTable (expected, table, {}, testee.DUPLICATES);

}

function testExistingKeyDup() {

    var testee = new recoil.structs.table.ImmutablePk();
    var tbl = new mkTable([1,2]);
    var table = testee.calculate({table : tbl.freeze()});
    var mtable = table.unfreeze();

    
    var expectedOrig = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}}}
    ];
    var expectedSrc = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1new",  meta : {cell : "b1"}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2new",  meta : {cell : "b2"}}}
    ];
    var mappings = checkTable (expectedOrig, table, {});
    var expectedDst = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1new",  meta : {cell : "b1"},  id:mappings[1], dups:[mappings[2]]}},
        {a: {val: 1, meta: {cell : "a2"}}, b: {val:"b2new",  meta : {cell : "b2"}}, id:mappings[2], dups:[mappings[1]]}
    ];

    
    mtable.set([mappings[1]],COL_B, "b1new");
    mtable.set([mappings[2]],COL_B, "b2new");
    mtable.set([mappings[2]],COL_A, 1);

    var res = testee.inverse(mtable.freeze(), {table:tbl.freeze()});
    checkTable (expectedSrc, res.table, {});
    table = testee.calculate({table: res.table});
    checkTable (expectedDst, table, {}, testee.DUPLICATES);

    // test removing a row
    mtable = table.unfreeze();
    mtable.removeRow([mappings[2]]);
    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1new",  meta : {cell : "b1"},  id:mappings[1], dups:[]}},
    ];
    res = testee.inverse(mtable.freeze(), {table:res.table});
    checkTable (expected, res.table, {});
    table = testee.calculate({table: res.table});
    checkTable (expected, table, {}, testee.DUPLICATES);
}


function testRemove() {

    var testee = new recoil.structs.table.ImmutablePk();
    var tbl = new mkTable([1,2]);
    var table = testee.calculate({table : tbl.freeze()});
    var mtable = table.unfreeze();

    
    var expectedOrig = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}}}
    ];
    var mappings = checkTable (expectedOrig, table, {});
    var expectedDst = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}}},
    ];

    
    mtable.removeRow([mappings[2]]);

    var res = testee.inverse(mtable.freeze(), {table:tbl.freeze()});
    checkTable (expectedDst, res.table, {});
    checkTable (expectedDst, testee.calculate({table: res.table}), {});
}
