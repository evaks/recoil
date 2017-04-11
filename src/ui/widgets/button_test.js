goog.provide('recoil.ui.widgets.ButtonWidgetTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.ui.widgets.ButtonWidget');
goog.require('recoil.util');
goog.require('recoil.frp.Frp');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.widgets.CheckboxWidget');
goog.require('goog.testing.AsyncTestCase');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
asyncTestCase.stepTimeout = 5000;
var shared = {};

function countDom (node) {
    node = node || document.body;
    var count = 1;

    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        count+= countDom(child);
    };
    return count;
}

function waitFor(test, start) {
    start = start || new Date().getTime();
    setTimeout(function () {
        if (test()) {
            asyncTestCase.continueTesting();
        }
        else {
            if (new Date().getTime() < start + asyncTestCase.stepTimeout) {
                waitFor(test);
            }
        }
    }, 10);
}

function testCreateButton01() {
    shared = {
        container : goog.dom.createDom('div', {id: 'foo'}),
        scope : new recoil.ui.WidgetScope()
    };
    var frp = shared.scope.getFrp();
    shared.startDom = countDom();
    shared.nameB = frp.createB("a button");
    shared.enabledB = frp.createNotReadyB();
    shared.valB = frp.createB(1);
    var callbackB = frp.createCallback(function () {
        shared.valB.set(shared.valB.get() + 1);
    }, shared.valB);

    
    shared.nameB.refListen(function (b) {
        asyncTestCase.continueTesting();
    });
    
    var buttonWidget = new recoil.ui.widgets.ButtonWidget(shared.scope);
    buttonWidget.getComponent().render(shared.container);
    buttonWidget.attach(shared.nameB, callbackB, shared.enabledB);

    assertEquals(0,frp.tm().watching());
    document.body.appendChild(shared.container);
    asyncTestCase.waitForAsync('test show button');
    
}

function testCreateButton02() {
    // test that the text on the button is set even though the other parts are
    // not good
    var b = findButton();
    assertEquals("a button", b.innerHTML);
    assertEquals(true, b.disabled);

    var frp = shared.scope.getFrp();
    frp.accessTrans(function () {
        shared.enabledB.set(recoil.ui.BoolWithExplanation.TRUE);
    }, shared.enabledB);

    assertEquals(false, b.disabled);

    frp.accessTrans(function () {
        shared.nameB.set("b button");
    }, shared.nameB);

    assertEquals("b button", b.innerHTML);

    frp.accessTrans(function () {
        shared.enabledB.set(new recoil.ui.BoolWithExplanation(false, undefined, new recoil.ui.message.Message("hi")));
    }, shared.enabledB);
    goog.dom.removeNode(shared.container);
    asyncTestCase.waitForAsync('test hide button');
}
function testCreateButton03() {
    var frp = shared.scope.getFrp();
    assertEquals(0,frp.tm().watching());
    assertEquals(shared.startDom, countDom());
}

function findButton(val) {
    return goog.dom.findNode(shared.container, function (n) {
         
        return n.nodeName === 'BUTTON';
    }) ;
}


function findVal(val) {
    return goog.dom.findNode(shared.container, function (n) {
        return n.nodeName === '#text' && n.nodeValue === val;
    }) ;
}

function getAncestor (node, type) {
    var parent = goog.dom.getParentElement(node);

    while (parent.nodeName !== type) {
        parent = goog.dom.getParentElement(parent);
    }
    return parent;
}
