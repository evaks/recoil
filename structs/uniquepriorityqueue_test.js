goog.provide('recoil.structs.UniquePriorityQueueTest');

goog.require('recoil.structs.UniquePriorityQueue');
goog.require('goog.testing.jsunit');

goog.setTestOnly('recoil.structs.UniquePriorityQueueTest');

function testOrdering() {
	function comp(a, b) {
		return a - b;
	}
	var h = new recoil.structs.UniquePriorityQueue(comp);

	h.push(5);
	h.push(7);
	h.push(3);
	h.push(6);

    assertEquals(3, h.pop());
    assertEquals(5, h.pop());
    assertEquals(6, h.pop());
    assertEquals(7, h.pop());
    assertEquals(undefined, h.pop());  
}


function testNoDup() {
	
	function comp(a, b) {
		return a - b;
	}
	var h = new recoil.structs.UniquePriorityQueue(comp);

	h.push(5);
	h.push(7);
	h.push(5);
	h.push(3);
	h.push(6);

    assertEquals(3, h.pop());
    assertEquals(5, h.pop());
    assertEquals(6, h.pop());
    assertEquals(7, h.pop());
    assertEquals(undefined, h.pop());  
	
}