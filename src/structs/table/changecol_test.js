goog.provide('recoil.structs.table.ChangeColTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.structs.table.ChangeCol');
goog.require('recoil.util');
goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.frp.Frp');


goog.setTestOnly('recoil.structs.table.ChangeColTest');

var COL_A = new recoil.structs.table.ColumnKey("a");
var COL_B = new recoil.structs.table.ColumnKey("b");
var COL_PK = new recoil.structs.table.ColumnKey("pk");
var COL_C = new recoil.structs.table.ColumnKey("change");

var ADD = recoil.structs.table.ChangeColType.ADD;
var CHANGE = recoil.structs.table.ChangeColType.CHANGE;
var DELETE = recoil.structs.table.ChangeColType.DELETE;
var NONE = recoil.structs.table.ChangeColType.NONE;



function checkTable(expected, table, changeCol) {
    assertEquals(expected.length, table.size());
    if (changeCol) {
        assertObjectEquals("colMeta", {col:true}, table.getColumnMeta(changeCol));
    }
    var mappings = {};
    var pos = 0;
    table.forEach(function (tblRow, keys) {
        var row = expected[pos];
        assertEquals("a.value [" + pos + "]", row.a.val, tblRow.get(COL_A));
        assertEquals("b.value [" + pos + "]", row.b.val, tblRow.get(COL_B));
        assertObjectEquals("a.meta [" + pos + "]",row.a.meta, tblRow.getCellMeta(COL_A));
        assertObjectEquals("b.meta [" + pos + "]",row.b.meta, tblRow.getCellMeta(COL_B));

        if (changeCol) {
            assertObjectEquals("c.value [" + pos + "]", row.c.val, tblRow.get(changeCol));
        }
        if (row.rowMeta) {
            assertObjectEquals("rowMeta [" + pos + "]", row.rowMeta, tblRow.getRowMeta());
        }
        mappings[tblRow.get(COL_A)] = keys[0];
        pos++;
    });
    // map from origkey to immutable key
    return mappings;
}
var mkTable = function (rows, orig) {
    var tbl = orig ? new recoil.structs.table.MutableTable([COL_A], [COL_B]) :
        new recoil.structs.table.MutableTable([COL_PK], [COL_A,COL_B]);
    tbl.setMeta({tableMeta:true});
    
    tbl.setColumnMeta(COL_A, {meta:"a", position:1});
    tbl.setColumnMeta(COL_B, {meta:"b", position:2});
    
    var pos = 0;
    
    var genRow = function (val) {
        var row = new recoil.structs.table.MutableTableRow(pos++);
        row.set(COL_PK,pos-1);
        row.set(COL_A, val);
        row.setCellMeta(COL_A, {cell : "a" + val});
        row.set(COL_B, "b" + val);
        row.setCellMeta(COL_B, {cell : "b" + val});
        tbl.addRow(row);
    };
    rows.forEach(genRow);
    return tbl;
};

function testAddedRow() {
    var frp = new recoil.frp.Frp();
    
    var origB = frp.createB(new mkTable([1,3,4], true).freeze());
    var newB = frp.createB(new mkTable([1,2,3,4], false).freeze());
    var testeeB = recoil.structs.table.ChangeCol.createB(newB, origB, COL_C, {col: true}, {del:true});
    
    frp.attach(testeeB);
    

    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}}
    ];
    var mappings = [];
    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        mappings = checkTable (expected, table, COL_C);
        var mtable = table.unfreeze();
        mtable.set([mappings[2]], COL_B, "b2new");
        testeeB.set(mtable.freeze());
    }, testeeB);


    expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2new",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}}
    ];

    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        mappings = checkTable (expected, table, COL_C);

        // now add a new duplicate key directly to newB
        var mtable = mkTable([1,2,3,4,2], false);
        mtable.set([1], COL_B, "b2new");
        newB.set(mtable.freeze());
    }, testeeB, newB);

    expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2new",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}}
    ];

    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        checkTable (expected, table, COL_C);

        // now change an existing row to a new row key
        var mtable = table.unfreeze();
        mtable.set([mappings[1]], COL_A, 2);
        testeeB.set(mtable.freeze());
    }, testeeB, newB);

    var changes = {};
    changes[COL_A] = 1;
    expected = [
        {a: {val: 2, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}},
         c: {val: {changes: changes, type: CHANGE}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 4, meta: {cell : "a4"}}, b: {val:"b4",  meta : {cell : "b4"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2new",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: ADD}}}
    ];

    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        checkTable (expected, table, COL_C);
    }, testeeB, newB);

}

function testChangeRow() {
    var frp = new recoil.frp.Frp();
    
    var origB = frp.createB(new mkTable([1,2], true).freeze());
    var mtable = new mkTable([1,2], false);
    mtable.set([0], COL_B, "b1new");
    var newB = frp.createB(mtable.freeze());
    var testeeB = recoil.structs.table.ChangeCol.createB(newB, origB, COL_C, {col: true}, {del:true});
    
    frp.attach(testeeB);
    

    var changes = {};
    changes[COL_B] = "b1";
    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1new",  meta : {cell : "b1"}},
         c: {val: {changes: changes, type: CHANGE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: NONE}}}
    ];
    var mappings = [];
    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        mappings = checkTable (expected, table, COL_C);
        var mtable = table.unfreeze();
        mtable.set([0], COL_B, "b1new.1");
        testeeB.set(mtable.freeze());
    }, testeeB);

    expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1new.1",  meta : {cell : "b1"}},
         c: {val: {changes: changes, type: CHANGE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: NONE}}}
    ];

    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        checkTable (expected, table, COL_C);
        var mtable = table.unfreeze();
        // duplicate primary key
        mtable.set([0], COL_A, 2);
        testeeB.set(mtable.freeze());
        
    }, testeeB, newB);

    changes = {};
    changes[COL_B] = "b1";
    changes[COL_A] = 1;

    expected = [
        {a: {val: 2, meta: {cell : "a1"}}, b: {val:"b1new.1",  meta : {cell : "b1"}},
         c: {val: {changes: changes, type: CHANGE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: NONE}}}
    ];
    
    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        checkTable (expected, table, COL_C);
        /*
        var mtable = table.unfreeze();
        // duplicate primary key
        mtable.set([0], COL_A, 2);
        testeeB.set(mtable.freeze());*/
        
    }, testeeB, newB);

}

function testChangeDelete() {
    var frp = new recoil.frp.Frp();
    
    var origB = frp.createB(new mkTable([1,2,3], true).freeze());
    var mtable = new mkTable([1,2], false);
    var newB = frp.createB(mtable.freeze());
    var testeeB = recoil.structs.table.ChangeCol.createB(newB, origB, COL_C, {col: true}, {del:true});
    
    frp.attach(testeeB);
    

    var changes = {};
    changes[COL_B] = "b1";
    var expected = [
        {a: {val: 1, meta: {cell : "a1"}}, b: {val:"b1",  meta : {cell : "b1"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 2, meta: {cell : "a2"}}, b: {val:"b2",  meta : {cell : "b2"}},
         c: {val: {changes: {}, type: NONE}}},
        {a: {val: 3, meta: {cell : "a3"}}, b: {val:"b3",  meta : {cell : "b3"}},
         c: {val: {changes: {}, type: DELETE}, rowMeta : {del: true}}}

    ];
    var mappings = [];
    frp.accessTrans(function () {
        var table = testeeB.get();
        assertObjectEquals({tableMeta: true}, table.getMeta());
        mappings = checkTable (expected, table, COL_C);
    }, testeeB);
}
