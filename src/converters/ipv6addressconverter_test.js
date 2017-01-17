goog.provide('recoil.converters.IPv6AddressConverterTest');


goog.require('recoil.converters.IPv6AddressConverter');

goog.require('goog.testing.jsunit');

goog.setTestOnly('recoil.frp.IPv6AddressConverterTest');

function testRemoveZeroSeq() {
    var testee = new recoil.converters.IPv6AddressConverter(true, true, false);
    assertEquals("1::2:3:4",testee.convert([1,0,0,0,0,2,3,4]));
    assertEquals("::2:3:4:5",testee.convert([0,0,0,0,2,3,4,5]));
    assertEquals("0:1:1:1:2:3:4:5",testee.convert([0,1,1,1,2,3,4,5]));
    assertEquals("2:3:4:5::",testee.convert([2,3,4,5,0,0,0,0]));
    assertEquals("::",testee.convert([0,0,0,0,0,0,0,0]));
    assertEquals("1:2:3:4:5:6:7:8",testee.convert([1,2,3,4,5,6,7,8]));

}

function testUnconvert() {
    var testee = new recoil.converters.IPv6AddressConverter(true, true, false);
    assertObjectEquals({error: null, value:[0,0,0,0,0,0,0,0]},testee.unconvert("::"));
    assertObjectEquals({error: null, value:[1,0,0,0,0,2,3,4]},testee.unconvert("1::2:3:4"));
}