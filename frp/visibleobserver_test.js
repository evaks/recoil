goog.provide('recoil.frp.VisibleObserverTest');

goog.require('goog.dom');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('recoil.exception.frp.NotInDom');
goog.require('recoil.frp.VisibleObserver');

goog.setTestOnly('recoil.frp.VisibleObserverTest');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
/**
 * 
 */
asyncTestCase.stepTimeout = 5000;

var visible;
var visible_e2;
var div1;
var observer;
function test01VisibleOnAttach() {

    observer = new recoil.frp.VisibleObserver();
    var body = goog.dom.getElement('body');
    div1 = document.createElement('div');
    div1.id = 'div_1';
    var div2 = document.createElement('div');
    var element = document.createTextNode('xxx');
    var e2 = document.createElement('div');
    e2.appendChild(document.createTextNode('Fire Helper'));
    e2.id = 'e2';

    div1.appendChild(div2);
    div2.appendChild(element);
    body.appendChild(div1);
    body.appendChild(e2);

    visible = false;
    var skip = 2;
    observer.listen(element, function(v) {
        visible = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    assertEquals(1, observer.getWatchedCount());

    observer.listen(e2, function(v) {
        visible_e2 = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    assertEquals(2, observer.getWatchedCount());

    assertEquals(true, visible);
    assertEquals(true, visible_e2);
    asyncTestCase.waitForAsync('testing hide');
    div1.hidden = true;

    // observer.forceObserve();
    // assertEquals(false, visible);
    // div1.hidden = false;
    // observer.forceObserve();
    // assertEquals(true, visible);

}

function test02Hide() {
    assertEquals(false, visible);
    asyncTestCase.waitForAsync('test showing');
    div1.hidden = false;

}

function test03Show() {
    assertEquals(true, visible);
    asyncTestCase.waitForAsync('test moving');

    var div2 = document.createElement('div');
    var body = goog.dom.getElement('body');
    div2.id = 'id_div2';
    body.appendChild(div2);
    body.removeChild(div1);
    div2.appendChild(div1);
    div2.hidden = true;
}

function test04Moving() {
    assertEquals(false, visible);
    asyncTestCase.waitForAsync('test moving show');
    var div2 = goog.dom.getElement('id_div2');
    div2.hidden = false;

}

function test05MovingShow() {
    assertEquals(2, observer.getWatchedCount());

    assertEquals(true, visible);
    var div2 = goog.dom.getElement('id_div2');
    div2.removeChild(div1);
    asyncTestCase.waitForAsync('test removing parent');

}

function test06RemovingParent() {
    assertEquals(false, visible);
    assertEquals(1, observer.getWatchedCount());

    var div2 = goog.dom.getElement('id_div2');
    var e2 = goog.dom.getElement('e2');
    div2.appendChild(div1);
    e2.hidden = true;
    asyncTestCase.waitForAsync('test removing parent');

}

function test07AttachInvalid() {
    var observer = new recoil.frp.VisibleObserver();
    try {

        var div = document.createElement('div');
        observer.listen(div, function(v) {

        });
        fail('expected exception');
    } catch (e) {
        assertTrue(e instanceof recoil.exception.frp.NotInDom);
    }

    assertEquals(0, observer.getWatchedCount());
}
function test08MultipleListens() {
    var e2 = goog.dom.getElement('e2');

    var skip = 1;
    visible = true;

    observer.listen(e2, function(v) {
        visible = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    assertEquals(false, visible);
    asyncTestCase.waitForAsync('multiple');
    e2.hidden = false;
}

function test09MultipleListensDone() {
    assertEquals(true, visible);
}
