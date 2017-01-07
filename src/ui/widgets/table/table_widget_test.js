goog.provide('recoil.ui.widgets.table.TableWidgetTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.ui.widgets.table.TableWidget');
goog.require('recoil.util');
goog.require('recoil.frp.Frp');
goog.require('recoil.ui.widgets.table.TableWidget');
goog.require('recoil.ui.widgets.TableMetaData');
goog.require('recoil.ui.widgets.ButtonWidget');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.widgets.table.StringColumn');
goog.require('recoil.ui.widgets.table.NumberColumn');
goog.require('recoil.ui.widgets.table.BooleanColumn');
goog.require('recoil.ui.widgets.CheckboxWidget');
goog.require('recoil.ui.widgets.table.SelectColumn');
goog.require('goog.testing.AsyncTestCase');

var typeFactories = {"int": function(meta) {
    return new recoil.ui.widgets.table.NumberColumn(meta);
}, "string": function (meta) {
    return new recoil.ui.widgets.table.StringColumn(meta);
}, "boolean": function (meta) {
    return new recoil.ui.widgets.table.BooleanColumn(meta);
}, "select": function (meta) {
    return new recoil.ui.widgets.table.SelectColumn(meta);
}};

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
asyncTestCase.stepTimeout = 5000;
var shared = {};

function testOrderChange01() {
    shared = {
        container : goog.dom.createDom('div', {id: 'foo'}),
        scope : new recoil.ui.WidgetScope()
    };
    var frp = shared.scope.getFrp();

    var tblKeys = {
        id : new recoil.structs.table.ColumnKey("id_"),
        value : new recoil.structs.table.ColumnKey("value_")
    };

    var rawTableMeta = {
        value : { type : "string", length : 20, key : tblKeys.value},
        id : { type : "int", primary : 0, key : tblKeys.id}
    };

   var rawTable = [];

    for (var i = 4; i >= 0; i--) {
	rawTable.push({id: i, value: "row " + i});
    }
    

    var columns = new recoil.ui.widgets.TableMetaData();
    columns.add(tblKeys.id, "ID");
    columns.add(tblKeys.value, "Value");
    

    shared.tableB = frp.createB(recoil.structs.table.Table.create(typeFactories, rawTableMeta, rawTable, true));
    var tableWidget = new recoil.ui.widgets.table.TableWidget(shared.scope);

    shared.tableB.refListen(function (b) {
        console.log("referenced", b);
        asyncTestCase.continueTesting();
    });
    tableWidget.getComponent().render(shared.container);
    tableWidget.attach(shared.tableB,columns);

    assertEquals(0,frp.tm().watching());
    document.body.appendChild(shared.container);

    asyncTestCase.waitForAsync('test show table');
}

function findInput(val) {
    return goog.dom.findNode(shared.container, function (n) {
         
        if (n.nodeName === 'INPUT') {
            console.log(n.nodeName, n.value, n.type);
        }
        return n.nodeName === 'INPUT' && n.value === val  && n.type === 'text';
    }) ;
}

function getAncestor (node, type) {
    var parent = goog.dom.getParentElement(node);

    while (parent.nodeName !== type) {
        parent = goog.dom.getParentElement(parent);
    }
    return parent;
}
function testOrderChange02() {
    var frp = shared.scope.getFrp();
    var watching = frp.tm().watching();
    assertNotEquals(0,watching); 
    
    shared.input = findInput('row 1');

    var row0 = findInput('row 0');
    assertNotUndefined(shared.input);

    var  tr1 = getAncestor(shared.input,'TR');
    var  tr0 = getAncestor(row0,'TR');

    assertTrue("init order correct",goog.dom.getNextElementSibling(tr1) === tr0);
    

    frp.accessTrans(function () {
        var tbl = shared.tableB.get().unfreeze();
        var row = tbl.getRow([1]).unfreeze();
        row.setPos(10);
        tbl.removeRow([1]);
        tbl.addRow(row);
        shared.tableB.set(tbl.freeze());
    },shared.tableB);
    
    assertTrue(findInput('row 0') === row0);
    assertTrue(findInput('row 1') === shared.input);
    assertTrue("final order correct",goog.dom.getNextElementSibling(tr0) === tr1);

    // no more behaviours should be added or removed
    assertEquals(watching,frp.tm().watching()); 

    document.body.removeChild(shared.container);
    asyncTestCase.waitForAsync('test remove table');
}


function testOrderChange03() {
    var frp = shared.scope.getFrp();
    assertEquals(0,frp.tm().watching());
    shared = {};
}
