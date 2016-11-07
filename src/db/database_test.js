goog.provide('recoil.db.DatabaseTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.Query');
goog.require('recoil.db.DatabaseComms');
goog.require('recoil.db.ReadOnlyDatabase');
goog.require('recoil.db.ReadWriteDatabase');

goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.db.DatabaseTest');


var VAL_KEY = new recoil.db.BasicType(['key'], 'val');
var HELLO_KEY = new recoil.db.BasicType(['key'], 'hello');
var WORLD_KEY = new recoil.db.BasicType(['key'], 'world');
var LIST_ITEM_KEY = new recoil.db.BasicType(['id'], 'list-item');
var LIST_KEY = new recoil.db.BasicType([], 'list', undefined, [new recoil.db.TypePath(LIST_ITEM_KEY, '[# id]')]);

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
MyDb.prototype.set = function(data, oldData, successFunc, failFunc, id, key, var_parameters) {
    console.log("db data set", key, data);
    var me = this;
    if (this.delay_) {
        this.delay_.push (function() {
            me.values_[id.getData()][key] = data;
            successFunc(data);
        });
    }
    else {
        this.values_[id.getData()][key] = data;
        console.log("sending data back", data);
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

    console.log("getting ",id, key);
    if (this.values_[id.getData()] === undefined) {
        this.values_[id.getData()] = {};
    }

    if (this.values_[id.getData()][key] === undefined) {
        if (id.getData() === 'list') {
            this.values_[id.getData()][key] = [{id: 1, v : 1} ,{id: 2, v: 2} ,{id : 3, v: 3},{id:4, v: 4}];
        }
        else {
            this.values_[id.getData()][key] = 'xxx' + id.getData() + "-" + key;
        }
    }
    var me = this;
    if (this.delay_) {
        this.delay_.push (function() {
            
            success(me.values_[id.getData()][key]);
        });
    }
    else {
        success(this.values_[id.getData()][key]);
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
 * @param {recoil.db.BasicKey} key
 * @return {*}
 */
MyDb.prototype.getValue = function(key, subKey) {
    return this.values_[key.getData()][subKey];
};

function testGetSame() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb();
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms);

    var a1 = readwriteDb.get(HELLO_KEY,'a');
    var a2 = readwriteDb.get(HELLO_KEY,'a');
    var c1 = readwriteDb.get(HELLO_KEY,'c');
    var b1 = readwriteDb.get(WORLD_KEY,'a');

    frp.attach(a1);
    frp.attach(a2);
    frp.attach(c1);
    frp.attach(b1);

    assertEquals('xxxhello-a', a1.unsafeMetaGet().get());
    assertEquals('xxxhello-a', a2.unsafeMetaGet().get());
    assertEquals('xxxhello-c', c1.unsafeMetaGet().get());
    assertEquals('xxxworld-a', b1.unsafeMetaGet().get());


    frp.accessTrans(function() {
        a1.set('goodbye');
    }, a1);

    assertEquals('goodbye', a1.unsafeMetaGet().get());
    assertEquals('goodbye', a2.unsafeMetaGet().get());
    assertEquals('xxxhello-c', c1.unsafeMetaGet().get());
    assertEquals('xxxworld-a', b1.unsafeMetaGet().get());
    

}

function testSet() {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb(true);
    var readwriteDb = new recoil.db.ReadWriteDatabase(frp, coms);
    var readDb = new recoil.db.ReadOnlyDatabase(frp, readwriteDb);
    var readwriteB = readwriteDb.get(HELLO_KEY,'a');
    var readB = readDb.get(HELLO_KEY,'a');

    assertFalse(readB.unsafeMetaGet().ready());
    frp.attach(readB);
    assertFalse(readB.unsafeMetaGet().ready());
    coms.process();
    assertTrue(readB.unsafeMetaGet().ready());
    assertEquals('xxxhello-a', readB.unsafeMetaGet().get());

    assertFalse(readwriteB.unsafeMetaGet().ready());
    frp.attach(readwriteB);
    assertTrue(readwriteB.unsafeMetaGet().ready());

    //need to put compare in entity in object_manager
    
    assertEquals('xxxhello-a', readwriteB.unsafeMetaGet().get());

    frp.accessTrans(function() {
        readwriteB.set('goodbye');
    }, readwriteB);

    assertEquals('goodbye', readwriteB.unsafeMetaGet().get());
    assertEquals('xxxhello-a', readB.unsafeMetaGet().get());
    coms.process();
    assertEquals('goodbye', readwriteB.unsafeMetaGet().get());
    assertEquals('goodbye', readB.unsafeMetaGet().get());
    assertEquals('goodbye', coms.getValue(HELLO_KEY,'a'));

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

    
    
    var val1 =  delayedDb.get(VAL_KEY,"key1");
    var val2 =  delayedDb.get(VAL_KEY,"key1");

    tm.attach(val1);
    tm.attach(val2);

    assertEquals("xxxval-key1", val2.unsafeMetaGet().get());


    frp.accessTrans(function () {
        val1.set(0);
    }, val1);


    assertEquals(0, val2.unsafeMetaGet().get());

    var val3 =  delayedDb.get(VAL_KEY,"key1");
    tm.attach(val3);

    assertEquals(0, val3.unsafeMetaGet().get());
    
    assertEquals("xxxval-key1",coms.getValue(VAL_KEY,"key1"));

    delayedDb.flush();

    assertEquals(0,coms.getValue(VAL_KEY,"key1"));


    frp.accessTrans(function () {
        val1.set(1);
    }, val1);

    assertEquals(0,coms.getValue(VAL_KEY,"key1"));
    assertEquals(1, val3.unsafeMetaGet().get());

    delayedDb.clear();

    assertEquals(0,coms.getValue(VAL_KEY,"key1"));
    assertEquals(0, val3.unsafeMetaGet().get());

}


function testGetList ()  {
    var frp = new recoil.frp.Frp();
    var coms = new MyDb(false);
    var db = new recoil.db.ReadWriteDatabase(frp, coms);
    var listB = db.get(LIST_KEY,'List');
    var listItem0B = db.get(LIST_ITEM_KEY, [1]);
    var listItem1B = db.get(LIST_ITEM_KEY, [2]);
    var listItem2B = db.get(LIST_ITEM_KEY, [3]);
    var listItem3B = db.get(LIST_ITEM_KEY, [4]);

    frp.attach(listB);

    var val = listB.unsafeMetaGet().get();

    // current problems we are initialting a database read when we get these
    // items, we should not go to the database for sub items that is the coms
    // layers job to do if it wants, but what happens if we update via sub items
    // shouldn't register with a val stop this a bit
    
    assertObjectEquals([{id: 1, v : 1 }, {id : 2, v : 2}, {id : 3, v : 3}, {id : 4, v : 4}], val);

    frp.attach(listItem0B);
    frp.attach(listItem1B);
    frp.attach(listItem2B);
    frp.attach(listItem3B);
    //currently there is no code to register subitems to the main list so
    //this is expected to fail
    assertObjectEquals({ id : 1, v : 1}, listItem0B.unsafeMetaGet().get());
    assertObjectEquals({ id : 2, v : 2}, listItem1B.unsafeMetaGet().get());
    assertObjectEquals({ id : 3, v : 3}, listItem2B.unsafeMetaGet().get());
    assertObjectEquals({ id : 4, v : 4}, listItem3B.unsafeMetaGet().get());

    frp.accessTrans(function () {
        listB.set([{id : 1, v : 11}, {id : 2, v: 12},{id : 3, v : 13},{id : 4, v : 14}]);
    }, listB);

    assertArrayEquals([{id : 1, v : 11},{id : 2, v: 12},{id : 3, v:13}, {id : 4, v: 14}], listB.unsafeMetaGet().get());
    assertObjectEquals({id : 1, v : 11}, listItem0B.unsafeMetaGet().get());
    assertObjectEquals({id : 2, v : 12}, listItem1B.unsafeMetaGet().get());
    assertObjectEquals({id : 3, v : 13}, listItem2B.unsafeMetaGet().get());
    assertObjectEquals({id : 4, v : 14}, listItem3B.unsafeMetaGet().get());

    // testing delete and object, we need ownership
    frp.accessTrans(function () {
        listB.set([{id : 1, v : 21}, {id : 2, v : 22},{id : 4, v : 24}]);
    }, listB);

    assertArrayEquals([{id : 1, v : 21},{id : 2, v: 22}, {id : 4, v: 24}], listB.unsafeMetaGet().get());
    
    assertObjectEquals({id : 1, v:21}, listItem0B.unsafeMetaGet().get());
    assertObjectEquals({id : 2, v:22}, listItem1B.unsafeMetaGet().get());
    assertObjectEquals([recoil.db.error.NOT_PRESENT], listItem2B.unsafeMetaGet().errors());
    assertObjectEquals({id : 4, v:24}, listItem3B.unsafeMetaGet().get());


    // test inserting

    // test reference counting, are there any entries left in the object manager, are getting data from the database
    // what happens if we never use it does the item hang around


    // test other types of objects not just list, items avl, object
    // TODO also test geting the sub item first then the list

}

