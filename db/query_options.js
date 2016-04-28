goog.provide('recoil.db.QueryTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.Query');

goog.setTestOnly('recoil.db.QueryTest');

function testField() {
    var scope = new recoil.db.QueryScope({"a" : 7, b : { c : "hello"}, d: [1,2,3] });
    var q = new recoil.db.Query();

    assertEquals(7, q.field("a").eval(scope));
    assertEquals("hello", q.field("b.c").eval(scope));
    assertEquals(2, q.field("d[1]").eval(scope));

    q.field$("a");
    assertEquals(7, q.eval(scope));
}


function testNot() {
    var scope = new recoil.db.QueryScope({t : true, f : false });
    var q = new recoil.db.Query();

    assertEquals(false, q.field("t").not().eval(scope));
    assertEquals(false, q.not(q.field("t")).eval(scope));
    assertEquals(true, q.field("t").not(q.field("f")).eval(scope));
    q.field$("t");
    q.not$();
    
    assertEquals(false, q.eval(scope));

    assertEquals(true, q.field("f").not().eval(scope));
    assertEquals(true, q.not(q.field("f")).eval(scope));
    assertEquals(false, q.field("f").not(q.field("t")).eval(scope));
}



function testAnd() {
    var scope = new recoil.db.QueryScope({t : true, f : false });
    var q = new recoil.db.Query();

    assertEquals(false, q.field("t").and(q.field("f")).eval(scope));
    assertEquals(true, q.field("t").and(q.field("t"), q.field("t")).eval(scope));
    assertEquals(false, q.field("f").and(q.field("t"), q.field("t")).eval(scope));
    assertEquals(false, q.field("t").and(q.field("f"), q.field("t")).eval(scope));
    assertEquals(false, q.field("t").and(q.field("t"), q.field("f")).eval(scope));

    q.and$(    q.field("t"),     q.field$("t"));
    assertTrue(q.eval(scope));
    


}


function testOr() {
    var scope = new recoil.db.QueryScope({t : true, f : false });
    var q = new recoil.db.Query();

    assertEquals(true, q.val(true).or(q.val(true)).eval(scope));
    assertEquals(true, q.val(true).or(q.val(false)).eval(scope));
    assertEquals(true, q.val(false).or(q.val(true)).eval(scope));
    assertEquals(false, q.val(false).or(q.val(false)).eval(scope));


    assertEquals(false, q.val(false).or(q.val(false)).or(q.val(false)).eval(scope));
    assertEquals(true, q.val(true).or(q.val(false)).or(q.val(false)).eval(scope));
    assertEquals(true, q.val(false).or(q.val(true)).or(q.val(false)).eval(scope));
    assertEquals(true, q.val(false).or(q.val(false)).or(q.val(true)).eval(scope));


    q.or$(true, false);
    assertTrue(q.eval(scope));
}

function testExists() {
    var scope = new recoil.db.QueryScope({ex : true, a :[1,2,3,{a:1}], n : null, u : undefined  });
    var q = new recoil.db.Query();
    assertTrue(q.exists("ex").eval(scope));
    assertTrue(q.exists("n").eval(scope));
    assertTrue(q.exists("u").eval(scope));
    assertTrue(q.exists("a[0]").eval(scope));
    assertFalse(q.exists("a[7]").eval(scope));
    assertTrue(q.exists("a[3].a").eval(scope));
    assertFalse(q.exists("a[3].b").eval(scope));
    assertFalse(q.exists("fred").eval(scope));
    assertFalse(q.exists("fred.y.z").eval(scope));
    
    assertFalse(q.notExists("ex").eval(scope));
    assertFalse(q.notExists("n").eval(scope));
    assertFalse(q.notExists("u").eval(scope));
    assertTrue(q.notExists("fred").eval(scope));

    q.exists$("u");
    assertTrue(q.eval(scope))

    q.notExists$("u");
    assertFalse(q.eval(scope))

}

function testEquals() {
    var scope = new recoil.db.QueryScope({a : "hello", b : 7 });
    var q = new recoil.db.Query();

    assertTrue(q.eq("a", q.val("hello")).eval(scope));
    assertTrue(q.eq(3, 3).eval(scope));
    assertTrue(q.eq(q.val("hello"),"a").eval(scope));
    assertFalse(q.eq(q.val("hello"),"b").eval(scope));
    assertFalse(q.eq("b", q.val("hello")).eval(scope));
    q.eq$("b", q.val("hello"))
    assertFalse(q.eval(scope));
    q.eq$("a", q.val("hello"))
    assertTrue(q.eval(scope));
}



function testNotEquals() {
    var scope = new recoil.db.QueryScope({a : "hello", b : 7 });
    var q = new recoil.db.Query();

    assertFalse(q.neq("a", q.val("hello")).eval(scope));
    assertFalse(q.neq(3, 3).eval(scope));
    assertFalse(q.neq(q.val("hello"),"a").eval(scope));
    assertTrue(q.neq(q.val("hello"),"b").eval(scope));
    assertTrue(q.neq("b", q.val("hello")).eval(scope));
    q.neq$("b", q.val("hello"))
    assertTrue(q.eval(scope));
    q.neq$("a", q.val("hello"))
    assertFalse(q.eval(scope));
}


function testLessThan() {
    var scope = new recoil.db.QueryScope({a : 1, b : 100 });
    var q = new recoil.db.Query();

    assertTrue(q.lt("a", "b").eval(scope));
    assertTrue(q.lt("a", 100).eval(scope));
    assertFalse(q.lt("a", 1).eval(scope));
    assertFalse(q.lt("b", "a").eval(scope));
    assertFalse(q.lt(1, "a").eval(scope));

    q.lt$("b", 101)
    assertTrue(q.eval(scope));
    q.lt$("b", 100)
    assertFalse(q.eval(scope));
}



function testLessThanEquals() {
    var scope = new recoil.db.QueryScope({a : 1, b : 100 });
    var q = new recoil.db.Query();

    assertTrue(q.lte("a", "b").eval(scope));
    assertTrue(q.lte("a", 100).eval(scope));
    assertTrue(q.lte("a", 1).eval(scope));
    assertFalse(q.lte("b", "a").eval(scope));
    assertTrue(q.lte(1, "a").eval(scope));

    q.lte$("b", 101)
    assertTrue(q.eval(scope));
    q.lte$("b", 100)
    assertTrue(q.eval(scope));
    q.lte$("b", 99)
    assertFalse(q.eval(scope));
}

// next



function testGreaterThan() {
    var scope = new recoil.db.QueryScope({a : 1, b : 100 });
    var q = new recoil.db.Query();

    assertFalse(q.gt("a", "b").eval(scope));
    assertFalse(q.gt("a", 100).eval(scope));
    assertFalse(q.gt("a", 1).eval(scope));
    assertTrue(q.gt("b", "a").eval(scope));
    assertFalse(q.gt(1, "a").eval(scope));

    q.gt$("b", 101)
    assertFalse(q.eval(scope));
    q.gt$("b", 100)
    assertFalse(q.eval(scope));
    q.gt$("b", 99)
    assertTrue(q.eval(scope));
}


function testIn() {
    var scope = new recoil.db.QueryScope({a : "aaa"});
    var q = new recoil.db.Query();

    
    assertTrue(q.isIn("a",["b","aaa","c"]).eval(scope));
    assertFalse(q.isIn("a",["b","a","c"]).eval(scope));

    
}

function testNotIn () {
    var scope = new recoil.db.QueryScope({a : "aaa"});
    var q = new recoil.db.Query();

    
    assertFalse(q.notIn("a",["b","aaa","c"]).eval(scope));
    assertTrue(q.notIn("a",["b","a","c"]).eval(scope));

}



function testRegExp () {
    var scope = new recoil.db.QueryScope({a : "aaabcd"});
    var q = new recoil.db.Query();

    
    assertTrue(q.regex("a",/A.*D/i).eval(scope));
    assertFalse(q.regex("a",/A.*D/).eval(scope));

    assertTrue(q.regex("a",'A.*D','i').eval(scope));
    assertFalse(q.regex("a",'A.*D').eval(scope));
}


function testWhere () {
    var scope = new recoil.db.QueryScope({a : 1, b : 100 });
    var q = new recoil.db.Query();

    assertFalse(q.where("this.a > this.b").eval(scope));
    assertFalse(q.where("obj.a > obj.b").eval(scope));
    assertTrue(q.where("this.a < this.b").eval(scope));
    assertTrue(q.where("obj.a < obj.b").eval(scope));

    assertFalse(q.where("function () {var x =10; return obj.a > x}").eval(scope));
    assertFalse(q.where("function () {var x =10; return obj.a > x}").eval(scope));
    assertTrue(q.where("function () {var x =0; return obj.a > x}").eval(scope));
    assertTrue(q.where("function () {var x =0; return obj.a > x}").eval(scope));

    q.where$("function () {var x =0; return obj.a > x}");
    assertTrue(q.eval(scope));
}

function testGreaterThanEquals() {
    var scope = new recoil.db.QueryScope({a : 1, b : 100 });
    var q = new recoil.db.Query();

    assertFalse(q.gte("a", "b").eval(scope));
    assertFalse(q.gte("a", 100).eval(scope));
    assertTrue(q.gte("a", 1).eval(scope));
    assertTrue(q.gte("b", "a").eval(scope));
    assertTrue(q.gte(1, "a").eval(scope));

    q.gte$("b", 101)
    assertFalse(q.eval(scope));
    q.gte$("b", 100)
    assertTrue(q.eval(scope));
    q.gte$("b", 99)
    assertTrue(q.eval(scope));
}
