goog.provide('recoil.converters.IPv4AddressConverterTest');


goog.require('recoil.converters.IPv4AddressConverter');

goog.require('goog.testing.jsunit');
goog.require('recoil.ui.message.Message');

goog.setTestOnly('recoil.frp.IPv4AddressConverterTest');


function testUnconvert() {
    var testee = new recoil.converters.IPv4AddressConverter();

    assertNotNull("too long", testee.unconvert("1.2.3.4.5").error);
    assertNotNull("invalid character", testee.unconvert("1.2.3.4a").error);
    assertNotNull("too short", testee.unconvert("1.2.3").error);
    assertNotNull("out of bounds", testee.unconvert("1.2.3.400").error);
    assertNotNull("negative number", testee.unconvert("1.2.-3.400").error);

    assertObjectEquals({error: null, value: [1, 2, 3, 4]}, testee.unconvert("1.2.3.4"));

    // assertNotNull(testee.unconvert("1h::").error);
    //
    // assertObjectEquals({
    //     error: null,
    //     value: [1, 2, 3, 4, 5, 6, 0x0102, 0x0304]
    // }, testee.unconvert("1:2:3:4:5:6:1.2.3.4"));
    // assertObjectEquals({
    //     error: null,
    //     value: [0, 2, 3, 4, 5, 6, 0x0102, 0x0304]
    // }, testee.unconvert("::2:3:4:5:6:1.2.3.4"));
    // assertObjectEquals({error: null, value: [1, 2, 3, 4, 0, 0, 0x0102, 0x0304]}, testee.unconvert("1:2:3:4::1.2.3.4"));

}

function testConvert() {
    var testee = new recoil.converters.IPv4AddressConverter();

    assertNotNull("negative", testee.convert([1,2,-3,4]).error);


}