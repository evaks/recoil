goog.provide('recoil.db.DatabaseTest');

goog.require('goog.testing.jsunit');
goog.require('recoil.db.DatabaseComms');

goog.require('recoil.frp.Frp');

goog.setTestOnly('recoil.db.DatabaseTest');

/**
 * gets data from the database
 *
 * @template T
 * @param {function(T)} successFunction called when the data is retrieve from the database, maybe called multiple times
 * @param {function(recoil.frp.BStatus)} failFunction called when the data fails to be retrieved from the database, maybe called multiple times
 * @param {string} id identifier of the object that to be retrieve from the database
 * @param {...*} var_parameters any extra parameters that maybe passed to the database
 *
 */
recoil.db.DatabaseComms.prototype.get = function(successFunction, failFunction, id, var_parameters) {
};

/**
 * sets data to the database
 * @template T
 * @param {T} data to set
 * @param {T} oldData old data that we already been received this can be used to only send changes
 * @param {function(T)} successFunction called when the data is retrieve from the database, the parameter is the set data
 * @param {function(recoil.frp.BStatus)} failFunction called when the data fails to be retrieved from the database
 * @param {string} id identifier of the object that to be retrieve from the database
 * @param {...*} var_parameters any extra parameters that maybe passed to the database
 *
 */

recoil.db.DatabaseComms.prototype.set = function(data, oldData, successFunction, failFunction, id, var_parameters) {

};

/**
 * @implements recoil.db.DatabaseComms
 * @constructor
 */
var MyDb = function() {
    this.values_ = {};

};

MyDb.prototype.set = function (data, oldData, successFunc, failFunc, id, var_parameters) {

};

MyDb.prototype.get = function (success, failure, id, var_params) {
    if (this.values_[id] == undefined) {
        this.values_[id] = "xxx" + id;
    }
    success(this.values_[id]);
};

function testGet() {
    var frp = new recoil.frp.Frp();

    var db = new recoil.db.ReadOnlyDatabase(frp, new MyDb());
    var b = db.get("hello");
    assertTrue(b === db.get("hello"));

    assertFalse(b.unsafeMetaGet().ready());
    frp.attach(b);
    assertTrue(b.unsafeMetaGet().ready());
    assertEquals("xxxhello",b.unsafeMetaGet().get());


}


function testSet() {
    var frp = new recoil.frp.Frp();
    var db = new recoil.db.ReadWriteDatabase(frp, new MyDb());
    var b = db.get("hello");

    assertFalse(b.unsafeMetaGet().ready());
    frp.attach(b);

    //assertTrue(b.unsafeMetaGet().ready());
    //assertEquals("xxxhello",b.unsafeMetaGet().get());
    //
    //frp.accessTrans(function () {
    //    b.set('goodbye');
    //}, b);
    //
    //assertEquals('goodbye', b.unsafeMetaGet().get());


}