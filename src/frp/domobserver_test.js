goog.provide('recoil.frp.DomObserverTest');

goog.require('goog.dom');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('recoil.exception.NotInDom');
goog.require('recoil.frp.DomObserver');

goog.setTestOnly('recoil.frp.DomObserverTest');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
/**
 *
 */
asyncTestCase.stepTimeout = 5000;

var visible;
var visible1;
var visible_e2;
var div1;
var observer = recoil.frp.DomObserver.instance;
function test01ExistsOnAttach() {

    var body = goog.dom.getElement('body');
    div1 = document.createElement('div');
    div1.id = 'div_1';
    var div2 = document.createElement('div');
    div2.id = 'div2_start';
    var element = document.createTextNode('xxx-');
    element.id = 'element.xxx';
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
      console.log('observer',v, element);
        visible = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    observer.listen(e2, function(v) {
        visible_e2 = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    assertEquals(true, visible);
    assertEquals(true, visible_e2);
    asyncTestCase.waitForAsync('testing hide');
    goog.dom.removeNode(div1);

}

function test02Add() {
    assertEquals(false, visible);
    asyncTestCase.waitForAsync('test showing');
    var body = goog.dom.getElement('body');
    body.appendChild(div1);

}
var visible_move;
function test03Move() {
    assertEquals(true, visible);
    var div2 = document.createElement('div');
    var body = goog.dom.getElement('body');
    div2.id = 'id_div2';
    body.appendChild(div2);
    body.removeChild(div1);
    div2.appendChild(div1);

    var element = document.createElement('div');
    var skip = 1;
    observer.listen(element, function(v) {
        visible_move = v;
        if (skip === 0) {
            asyncTestCase.continueTesting();
        } else {
            skip--;
        }
    });
    body.appendChild(element);
    assertEquals(false, visible_move);
    asyncTestCase.waitForAsync('test move');

}
function test04Done() {
    assertEquals(true, visible);
    assertEquals(true, visible_move);

}
