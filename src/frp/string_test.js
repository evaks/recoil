goog.provide('recoil.frp.StringTest');

goog.require('recoil.frp.string');
goog.require('goog.testing.jsunit');
goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.frp.StringTest');

function testConcat () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('x');
    var yB = frp.createB('y');
    var zB = frp.createB('z');

    var testeeB = recoil.frp.string.concat(xB, yB, zB);
  
    frp.attach(testeeB);

    assertEquals('xyz', testeeB.unsafeMetaGet().get());

    frp.accessTrans(function () {
        xB.set('x1');
    }, xB);
    assertEquals('x1yz', testeeB.unsafeMetaGet().get());
}

function testCharAt () {

    var frp = new recoil.frp.Frp();
    var testeeB = recoil.frp.string.charAt(frp.createB('123'), 1);
  
    frp.attach(testeeB);

    assertEquals('2', testeeB.unsafeMetaGet().get());
}

function testCharCodeAt () {

    var frp = new recoil.frp.Frp();
    var testeeB = recoil.frp.string.charCodeAt(frp.createB('123'), 1);
  
    frp.attach(testeeB);

    assertEquals('2'.charCodeAt(0), testeeB.unsafeMetaGet().get());
}

function testEndsWith () {

        var frp = new recoil.frp.Frp();
    var testee1B = recoil.frp.string.endsWith(frp.createB('123'), '3');
    var testee2B = recoil.frp.string.endsWith(frp.createB('123'), '4');
  
    frp.attach(testee1B);
    frp.attach(testee2B);
    assertTrue(testee1B.unsafeMetaGet().get());
    assertFalse(testee2B.unsafeMetaGet().get());
}

function testIndexOf () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('1231');

    var testee1B = recoil.frp.string.indexOf(xB,'1');
    var testee2B = recoil.frp.string.indexOf(xB,'1',1);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals(0, testee1B.unsafeMetaGet().get());
    assertEquals(3, testee2B.unsafeMetaGet().get());
}

function testLastIndexOf () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('1231');

    var testee1B = recoil.frp.string.lastIndexOf(xB,'1');
    var testee2B = recoil.frp.string.lastIndexOf(xB,'1',2);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals(3, testee1B.unsafeMetaGet().get());
    assertEquals(0, testee2B.unsafeMetaGet().get());
}

function testMatch () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('11aa2bb3');

    var testee1B = recoil.frp.string.match(xB,/[0-9]+/g);
    var testee2B = recoil.frp.string.match(xB,'7',2);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertObjectEquals(['11','2','3'], testee1B.unsafeMetaGet().get());
    assertObjectEquals(null, testee2B.unsafeMetaGet().get());
}

function testRepeat () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('ab');

    var testee1B = recoil.frp.string.repeat(xB,3);
    var testee2B = recoil.frp.string.repeat(xB,0);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals('ababab', testee1B.unsafeMetaGet().get());
    assertEquals('', testee2B.unsafeMetaGet().get());
}

function testReplace () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('abcd');

    var testee1B = recoil.frp.string.replace(xB,'b','x');
    var testee2B = recoil.frp.string.replace(xB,/bc/,'x');
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals('axcd', testee1B.unsafeMetaGet().get());
    assertEquals('axd', testee2B.unsafeMetaGet().get());
}

function testSearch () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('abcd');

    var testee1B = recoil.frp.string.search(xB,'b');
    var testee2B = recoil.frp.string.search(xB,/cd/,'x');
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals(1, testee1B.unsafeMetaGet().get());
    assertEquals(2, testee2B.unsafeMetaGet().get());
}

function testSlice () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('abcd');

    var testee1B = recoil.frp.string.slice(xB,1);
    var testee2B = recoil.frp.string.slice(xB,2,3);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals('bcd', testee1B.unsafeMetaGet().get());
    assertEquals('c', testee2B.unsafeMetaGet().get());
}

function testSplit () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('a,b,c,d');

    var testee1B = recoil.frp.string.split(xB,',');
    var testee2B = recoil.frp.string.split(xB,'z');
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertObjectEquals(['a','b','c','d'], testee1B.unsafeMetaGet().get());
    assertObjectEquals(['a,b,c,d'], testee2B.unsafeMetaGet().get());
}

function testStartsWith () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('abcd');

    var testee1B = recoil.frp.string.startsWith(xB,'abc');
    var testee2B = recoil.frp.string.startsWith(xB,'z');
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals(true, testee1B.unsafeMetaGet().get());
    assertEquals(false, testee2B.unsafeMetaGet().get());
}

function testSubStr () {

    var frp = new recoil.frp.Frp();

    var xB = frp.createB('abcd');

    var testee1B = recoil.frp.string.substr(xB,1,2);
    var testee2B = recoil.frp.string.substring(xB,2,3);
  
    frp.attach(testee1B);
    frp.attach(testee2B);

    assertEquals('bc', testee1B.unsafeMetaGet().get());
    assertEquals('c', testee2B.unsafeMetaGet().get());
}


