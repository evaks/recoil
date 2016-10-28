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
 * @param {function(recoil.frp.BStatus)} failFunction called when the data fails to be retrieved from the database, maybe called multiple times
 * @param {!recoil.db.Type<T>} id identifier of the object that to be retrieve from the database
 * @param {*} key the information we need to get the object/objects
 * @param {*} options
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
 * @param {*} key the information we need to get the object/objects
 * @param {*} options
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
 * @param {string} id identifier of the object that to be retrieve from the database
 * @param {...*} var_parameters any extra parameters that maybe passed to the database
 */
recoil.db.DatabaseComms.prototype.stop = function(id, var_parameters) {
};
