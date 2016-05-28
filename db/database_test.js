goog.provide('recoil.db.DatabaseTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.DatabaseComms');

goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.db.DatabaseTest');

/**
 * @implements recoil.db.DatabaseComms
 * @constructor
 */
var MyDb = function() {
    this.values_ = {};

};

MyDb.prototype.makeKey = function (args) {
    return args;
};
    
/**
 *
 * @param data
 * @param oldData
 * @param successFunc
 * @param failFunc
 * @param id
 * @param var_parameters
 */
MyDb.prototype.set = function(data, oldData, successFunc, failFunc, id, var_parameters) {
    this.values_[id] = data;
    successFunc(data);
};

/**
 *
 * @param success
 * @param failure
 * @param id
 * @param var_params
 */
MyDb.prototype.get = function(success, failure, id, var_params) {

    console.log("getting ",id);
    if (var_params !== undefined) {
        var value = id;

        for (var i = 3; i < arguments.length; i++) {
            var vals = getVals(arguments[i]);
            for (var j = 0; j < vals.length; j++) {
                value += '-' + vals[j];
            }
        }
        this.values_[id] = value;
    }
    else if (this.values_[id] === undefined) {
        this.values_[id] = 'xxx' + id;
    }

    success(this.values_[id]);
};

function getVals(vals) {
    var res = [];
    var i = 0;

    if (typeof vals === 'object') {
        for (var key in vals) {
            if (vals.hasOwnProperty(key)) {
                res[i] = vals[key];
                i++;
            }
        }
    }

    return res;
}

/**
 *
 * @param key
 * @return {*}
 */
MyDb.prototype.getValue = function(key) {
    return this.values_[key];
};

function testReadOnly () {
    assertFalse(true);
    //check that even if we set the read write database, the change
    //is not reflected in the read only database until the change is sent back from the server
};
    
function testGet() {
    var frp = new recoil.frp.Frp();

    var db = new recoil.db.ReadOnlyDatabase(frp, new MyDb());
    var b = db.get('hello');
    assertTrue(b === db.get('hello'));

    assertFalse(b.unsafeMetaGet().ready());
    frp.attach(b);
    assertTrue(b.unsafeMetaGet().ready());
    assertEquals('xxxhello', b.unsafeMetaGet().get());

    frp.accessTrans(function() {
        b.set('fred');
    }, b);

    assertEquals('xxxhello', b.unsafeMetaGet().get());
}


function testSet() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb();
    var readDb = new recoil.db.ReadOnlyDatabase(frp, new MyDb());
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms, readDb);
    var readwriteB = readwriteDb.get('hello');
    var readB = readDb.get('hello');

    assertFalse(readB.unsafeMetaGet().ready());
    frp.attach(readB);
    assertTrue(readB.unsafeMetaGet().ready());

    assertFalse(readwriteB.unsafeMetaGet().ready());
    frp.attach(readwriteB);
    assertTrue(readwriteB.unsafeMetaGet().ready());

    assertEquals('xxxhello', readwriteB.unsafeMetaGet().get());

    frp.accessTrans(function() {
        readwriteB.set('goodbye');
    }, readwriteB);

    assertEquals('goodbye', readwriteB.unsafeMetaGet().get());
    assertEquals('goodbye', coms.getValue('hello'));

    // Writing to the readwritedb the change should be reflected on the readdb and
    // write to the readdb and the change should not be on the readwritedb
    frp.accessTrans(function() {
        readwriteB.set('boo');
        readB.set('smokey');
    }, readwriteB, readB);

    assertEquals('boo', readB.unsafeMetaGet().get());
    assertEquals('boo', readwriteB.unsafeMetaGet().get());

}

function testParameterGet() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb();
    var readDb = new recoil.db.ReadOnlyDatabase(frp, new MyDb());
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms, readDb);
    //var readwriteB = readwriteDb.get("hello");
    var user1B = readDb.get('user', {name: 'bob'});
    var user2B = readDb.get('user', {name: 'jimbo', age: 9}, {x: 'ss'});


    frp.attach(user1B);
    frp.attach(user2B);

    assertEquals('user-bob', user1B.unsafeMetaGet().get());
    assertEquals('user-jimbo-9-ss', user2B.unsafeMetaGet().get());

    //var b = {v:"stuff"};
    //var key =  {name : "hello", loop : b};
    //b.back = key;

}


function testDelayed () {
    var frp = new recoil.frp.Frp();
    var tm = frp.tm();
    var coms = new MyDb();

    var readDb = new recoil.db.ReadOnlyDatabase(frp, coms);
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms, readDb);
    var delayedDb = new recoil.db.DelayedDatabase(frp, readwriteDb);
    
    var val1 =  delayedDb.get("val");
    var val2 =  delayedDb.get("val");

    tm.attach(val1);
    tm.attach(val2);

    assertEquals("xxxval", val2.unsafeMetaGet().get());


    frp.accessTrans(function () {
        val1.set(0);
    }, val1);


    assertEquals(0, val2.unsafeMetaGet().get());

    var val3 =  delayedDb.get("val");
    tm.attach(val3);

    assertEquals(0, val3.unsafeMetaGet().get());
    
    assertEquals("xxxval",coms.getValue("val"));

    delayedDb.flush();

    assertEquals(0,coms.getValue("val"));


    frp.accessTrans(function () {
        val1.set(1);
    }, val1);

    assertEquals(0,coms.getValue("val"));
    assertEquals(1, val3.unsafeMetaGet().get());

    delayedDb.clear();

    assertEquals(0,coms.getValue("val"));
    assertEquals(0, val3.unsafeMetaGet().get());

}
