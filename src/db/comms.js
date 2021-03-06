goog.provide('recoil.db.DatabaseComms');

goog.require('recoil.frp.BStatus');

/**
 * @interface
 */
recoil.db.DatabaseComms = function() {
};


/**
 * gets data from the database
 *
 * @template T
 * @param {function(T)} successFunction called when the data is retrieve from the database, maybe called multiple times
 * @param {function(!recoil.frp.BStatus)} failFunction called when the data fails to be retrieved from the database, maybe called multiple times
 * @param {!recoil.db.Type<T>} id identifier of the object that to be retrieve from the database
 * @param {?} key the information we need to get the object/objects
 * @param {recoil.db.QueryOptions} options
 *
 */
recoil.db.DatabaseComms.prototype.get = function(successFunction, failFunction, id, key, options) {
};

/**
 * sets data to the database
 * @template T
 * @param {T} data to set
 * @param {T} oldData old data that we already been received this can be used to only send changes
 * @param {function(T)} successFunction called when the data is retrieve from the database, the parameter is the set data
 * @param {function(recoil.frp.BStatus)} failFunction called when the data fails to be retrieved from the database
 * @param {!recoil.db.Type<T>} id identifier of the object that to be retrieve from the database
 * @param {?} key the information we need to get the object/objects
 * @param {recoil.db.QueryOptions} options
 */

recoil.db.DatabaseComms.prototype.set = function(data, oldData, successFunction, failFunction, id, key, options) {

};

/**
 * @param {!IArrayLike} values
 * @return {!Object}
 */
recoil.db.DatabaseComms.prototype.makeKey = function(values) {
};
/**
 * instruct the databse that we are no longer interested
 * @template T
 * @param {!recoil.db.Type<T>} id identifier of the object that to be retrieve from the database
 * @param {?} key the key to stop
 * @param {recoil.db.QueryOptions} options the key to stop
 */
recoil.db.DatabaseComms.prototype.stop = function(id, key, options) {
};


/**
 * called when a frp transaction is started
 */
recoil.db.DatabaseComms.prototype.startTrans = function() {
};


/**
 * called when a frp transaction is ended, if you want to store changes up until every thing
 * is propogated use this
 */
recoil.db.DatabaseComms.prototype.stopTrans = function() {
};
