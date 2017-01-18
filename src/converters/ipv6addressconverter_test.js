goog.provide('recoil.converters.IPv6AddressConverterTest');


goog.require('recoil.converters.IPv6AddressConverter');

goog.require('goog.testing.jsunit');
goog.require('recoil.ui.message.Message');

goog.setTestOnly('recoil.frp.IPv6AddressConverterTest');

function testRemoveZeroSeq() {
    var testee = new recoil.converters.IPv6AddressConverter(true, true, false);

    assertEquals("1::2:3:4", testee.convert([1, 0, 0, 0, 0, 2, 3, 4]));
    assertEquals("::2:3:4:5", testee.convert([0, 0, 0, 0, 2, 3, 4, 5]));
    assertEquals("0:1:1:1:2:3:4:5", testee.convert([0, 1, 1, 1, 2, 3, 4, 5]));
    assertEquals("2:3:4:5::", testee.convert([2, 3, 4, 5, 0, 0, 0, 0]));
    assertEquals("::", testee.convert([0, 0, 0, 0, 0, 0, 0, 0]));
    assertEquals("1:2:3:4:5:6:7:8", testee.convert([1, 2, 3, 4, 5, 6, 7, 8]));

}

function testUnconvert() {
    var testee = new recoil.converters.IPv6AddressConverter(true, true, false);

    assertNotNull("zero ::", testee.unconvert("1:2:3:4:5:6:7::8").error);
    assertNotNull("zero ::", testee.unconvert("::::").error);
    assertNotNull("invalid ipv6", testee.unconvert("1.2.3.4").error);
    assertNotNull("invalid single colon", testee.unconvert(":").error);
    assertNotNull("cannot have single character", testee.unconvert("a").error);
    assertNotNull("blank not allowed", testee.unconvert("").error);
    assertNotNull("zero ::", testee.unconvert(":1,2,3,4,5,6,7").error);
    assertNotNull("too long", testee.unconvert(":1,2,3,4,5,6,7,8").error);
    assertNotNull("invalid character", testee.unconvert(":1,2,3,4,5,6,7,z").error);

    assertObjectEquals({error: null, value: [0, 0, 0, 0, 0, 0, 0, 0]}, testee.unconvert("::"));
    assertObjectEquals({error: null, value: [1, 2, 3, 4, 5, 6, 7, 8]}, testee.unconvert("1:2:3:4:5:6:7:8"));
    assertObjectEquals({error: null, value: [1, 0, 0, 0, 0, 2, 3, 4]}, testee.unconvert("1::2:3:4"));
    assertObjectEquals({error: null, value: [0, 0, 0, 0, 0, 2, 3, 4]}, testee.unconvert("::2:3:4"));
    assertObjectEquals({error: null, value: [1, 2, 3, 4, 0, 0, 0, 0]}, testee.unconvert("1:2:3:4::"));
    assertObjectEquals({error: null, value: [1, 2, 3, 4, 0, 0, 7, 8]}, testee.unconvert("1:2:3:4::7:8"));
    assertObjectEquals({error: null, value: [0, 0, 3, 4, 0, 0, 0, 0]}, testee.unconvert("0:0:3:4::"));
    assertObjectEquals({error: null, value: [0, 0, 0, 0, 0, 0, 0, 1]}, testee.unconvert("::1"));
    assertObjectEquals({error: null, value: [1, 0, 0, 0, 0, 0, 0, 1]}, testee.unconvert("1::1"));
    assertObjectEquals({error: null, value: [1, 2, 0, 0, 0, 0, 0, 1]}, testee.unconvert("1:2::1"));
    assertObjectEquals({error: null, value: [1, 0, 0, 0, 0, 0, 0, 0]}, testee.unconvert("1::"));
    assertObjectEquals({error: null, value: [1, 2, 3, 4, 5, 6, 7, 0]}, testee.unconvert("1:2:3:4:5:6:7::"));

    assertNotNull("too long", testee.unconvert("1:2:3:4:5:6:7::2::3").error);
    assertNotNull("multi colon", testee.unconvert("1::2::3").error);
    assertNotNull(testee.unconvert("1h::").error);

    assertObjectEquals({
        error: null,
        value: [1, 2, 3, 4, 5, 6, 0x0102, 0x0304]
    }, testee.unconvert("1:2:3:4:5:6:1.2.3.4"));
    assertObjectEquals({
        error: null,
        value: [0, 2, 3, 4, 5, 6, 0x0102, 0x0304]
    }, testee.unconvert("::2:3:4:5:6:1.2.3.4"));
    assertObjectEquals({error: null, value: [1, 2, 3, 4, 0, 0, 0x0102, 0x0304]}, testee.unconvert("1:2:3:4::1.2.3.4"));

}

function testPadWithZeros() {
    var testee = new recoil.converters.IPv6AddressConverter(true, false, false);

    assertEquals("0001:0ab2:0013:ffff:0005:0006:0007:0008", testee.convert([1, 0xab2, 0x13, 0xffff, 5, 6, 7, 8]));
}