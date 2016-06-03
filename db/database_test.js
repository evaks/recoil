goog.provide('recoil.db.DatabaseTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.Query');
goog.require('recoil.db.DatabaseComms');
goog.require('recoil.db.ReadOnlyDatabase');
goog.require('recoil.db.ReadWriteDatabase');

goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.db.DatabaseTest');

/**
 * @implements recoil.db.DatabaseComms
 * @constructor
 */
var MyDb = function(opt_delay) {
    this.values_ = {};
    this.delay_ = opt_delay ? [] :false ;
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
    var me = this;
    if (this.delay_) {
        this.delay_.push (function() {
            me.values_[id] = data;
            successFunc(data);
        });
    }
    else {
        this.values_[id] = data;
        successFunc(data);
        
    }

};

/**
 *
 * @param success
 * @param failure
 * @param id
 * @param var_params
 */
MyDb.prototype.get = function(success, failure, id, key, options) {

    console.log("getting ",id);
    if (this.values_[id] === undefined) {
        this.values_[id] = 'xxx' + id;
    }

    var me = this;
    if (this.delay_) {
        this.delay_.push (function() {
            
            success(me.values_[id]);
        });
    }
    else {
        success(this.values_[id]);
    }
};

MyDb.prototype.process = function () {
    this.delay_.pop()();
};

MyDb.prototype.processQueueSize = function () {
    return this.delay_.length;
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

function testGetSame() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb();
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms);

    var a1 = readwriteDb.get('hello');
    var a2 = readwriteDb.get('hello');
    var b1 = readwriteDb.get('world');

    frp.attach(a1);
    frp.attach(a2);
    frp.attach(b1);

    assertEquals('xxxhello', a1.unsafeMetaGet().get());
    assertEquals('xxxhello', a2.unsafeMetaGet().get());
    assertEquals('xxxworld', b1.unsafeMetaGet().get());


    frp.accessTrans(function() {
        a1.set('goodbye');
    }, a1);

    assertEquals('goodbye', a1.unsafeMetaGet().get());
    assertEquals('goodbye', a2.unsafeMetaGet().get());
    assertEquals('xxxworld', b1.unsafeMetaGet().get());
    

}

function testGetList () {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb(true);
    var db = new recoil.db.ReadWriteDatabase(frp, coms);

    var a = db.get('a',[1]);
    var b = db.get('a',[3]);
    frp.attach(a);
    var list = db.getList('a', recoil.db.Query.True);
    frp.attach(list);

    assertEquals('xxxa', a.unsafeMetaGet().get());
    assertEquals('xxxa', list.unsafeMetaGet().get()[0]);
    assertEquals('xxxa', list.unsafeMetaGet().get()[1]);
    assertEquals('xxxa', list.unsafeMetaGet().get()[2]);


    frp.accessTrans(function () {
        a.set('a1');
    },a);
    

    assertEquals('a1', a.unsafeMetaGet().get());
    assertEquals('xxxa', list.unsafeMetaGet().get()[0]);
    assertEquals('a1', list.unsafeMetaGet().get()[1]);
    assertEquals('xxxa', list.unsafeMetaGet().get()[2]);


    var newList = goog.array.clone(list.unsafeMetaGet().get());
    newList.push('b');
    
    frp.accessTrans(function () {
        list.set(newList);
    },list);

    frp.attach(b);
    
    assertEquals('a1', a.unsafeMetaGet().get());
    assertEquals('b', b.unsafeMetaGet().get());
    assertEquals('xxxa', list.unsafeMetaGet().get()[0]);
    assertEquals('a1', list.unsafeMetaGet().get()[1]);
    assertEquals('xxxa', list.unsafeMetaGet().get()[2]);
    assertEquals('b', list.unsafeMetaGet().get()[3]);

    //check it has been sent to the database
    assertTrue("not implemented yet, insert, delete",false);
}
function testSet() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb(true);
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms);
    var readDb = new recoil.db.ReadOnlyDatabase(frp, readwriteDb);
    var readwriteB = readwriteDb.get('hello');
    var readB = readDb.get('hello');

    assertFalse(readB.unsafeMetaGet().ready());
    frp.attach(readB);
    assertFalse(readB.unsafeMetaGet().ready());
    coms.process();
    assertTrue(readB.unsafeMetaGet().ready());
    assertEquals('xxxhello', readB.unsafeMetaGet().get());

    assertFalse(readwriteB.unsafeMetaGet().ready());
    frp.attach(readwriteB);
    assertTrue(readwriteB.unsafeMetaGet().ready());

    //need to put compare in entity in object_manager
    
    assertEquals('xxxhello', readwriteB.unsafeMetaGet().get());

    frp.accessTrans(function() {
        readwriteB.set('goodbye');
    }, readwriteB);

    assertEquals('goodbye', readwriteB.unsafeMetaGet().get());
    assertEquals('xxxhello', readB.unsafeMetaGet().get());
    coms.process();
    assertEquals('goodbye', readwriteB.unsafeMetaGet().get());
    assertEquals('goodbye', readB.unsafeMetaGet().get());
    assertEquals('goodbye', coms.getValue('hello'));

    // Writing to the readwritedb the change should be reflected on the readdb and
    // write to the readdb and the change should not be on the readwritedb
    frp.accessTrans(function() {
        readwriteB.set('boo');
        readB.set('smokey');
    }, readwriteB, readB);

    coms.process();
    assertEquals(0, coms.processQueueSize());
    assertEquals('boo', readB.unsafeMetaGet().get());
    assertEquals('boo', readwriteB.unsafeMetaGet().get());

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
