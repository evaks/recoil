goog.provide('recoil.util.TokenizerTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.util.Tokenizer');

goog.setTestOnly('recoil.util.TokenizerTest');


function testBrackets() {

    
    var testee = new recoil.util.Tokenizer();

    assertObjectEquals([{type:'('},
			{type:')'}
                 ], testee.tokenize(' ()'));
}

function testNumber() {
    
    var testee = new recoil.util.Tokenizer();
    assertObjectEquals([{type:'('},
                  {type:'num', value:'123.1'}
                 ], testee.tokenize(' (123.1'));

    assertObjectEquals([{type:'num', value:'123.1'},
			{type: '/'},
			{type: 'num', value: '60'}
                       ], testee.tokenize('123.1 / 60'));
    
    assertObjectEquals([{type:'('},
                  {type:'('},
                  {type:'num', value:'123.1'},
                  {type:'*'},
                  {type:'num', value:'2'},
                  {type:')'},
                  {type:'+'},
                  {type:'num', value:'13'},
                  {type:')'},
                 ], testee.tokenize(' ((123.1 * 2) + 13)'));
}

function testInvalid() {
    
    var testee = new recoil.util.Tokenizer();
    assertNull(testee.tokenize(' @ (123.1'));

    assertNull(testee.tokenize('123.1.1'));
}

function testIdentifiers() {
    
    var testee = new recoil.util.Tokenizer();
    assertObjectEquals([{type:'ident', value: 'xyz1'}],
		       testee.tokenize('xyz1'));
}


function testEvalPlus() {
    
    var testee = new recoil.util.ExpParser();
    assertEquals(2, testee.eval(' 1 + 1'));
}

function testEvalDiv() {
    
    var testee = new recoil.util.ExpParser();
    assertEquals(1, testee.eval(' 1 / 1'));
}

function testEvalBracket() {
    
    var testee = new recoil.util.ExpParser();
    assertEquals(10, testee.eval('(2+3)*2'));
}


function testEvalCeil() {
    
    var testee = new recoil.util.ExpParser();
    assertEquals(1, testee.eval('ceil(1+ floor(0.95))'));
}


function testEvalUnaryNeg() {
    
    var testee = recoil.util.ExpParser.instance;
    assertEquals(2, testee.eval(' 1 + - + - + 1'));
}

function testEvalPow() {
    
    var testee = recoil.util.ExpParser.instance;
    assertEquals(32, testee.eval('2 ^ 5'));
}


