goog.provide('recoil.db.DatabaseComms');
goog.provide('recoil.db.ReadOnlyDatabase');
goog.provide('recoil.db.Database');

goog.require('goog.structs.AvlTree');

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

recoil.db.DatabaseComms.prototype.set = function(data,oldData, successFunction, failFunction, id, var_parameters) {

};


/**
 * @constructor
 * @implements {recoil.db.Database}
 * @param {recoil.frp.Frp} frp the associated FRP engine
 * @param {recoil.db.DatabaseComms} dbComs the interface to get and set data to the backend
 */
recoil.db.ReadOnlyDatabase = function(frp, dbComs) {
    this.frp_ = frp;
    this.dbComs_ = dbComs;
    this.objects_ = new goog.structs.AvlTree(recoil.db.ReadOnlyDatabase.KEY_COMPARATOR_);
};


/**
 * @template T
 * @param {string} id the id of the object to get
 * @param {...*} var_paramters the parameters to the get function, this can be usesful if you want to get something like
 *            a particular id
 * @return recoil.frp.Behaviour<T>
 */
recoil.db.ReadOnlyDatabase.prototype.get = function(id, var_parameters) {
    var key = [id];
    for (var i = 1; i < arguments.length; i++) {
        key.push(arguments[i]);
    }

    var b = this.objects_.find({key : key});
    if (b !== null) {
        return b;
    }
    b = this.frp_.createMetaB(recoil.frp.BStatus.notReady());
    var me = this;
    var args = [id, function(data) {
        b.set(data)
    }, function(error) {
        b.metaSet(error);
    }];

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    b.refListen(function(hasRef) {
        if (hasRef) {
            me.dbComs_.get.apply(me.dbComs_, args);
        } else {
            me.dbComs_.stop.apply(me.dbComs_, key);
        }

    });

    this.objects_.add({key : key, value : b});
    return b;
};



/**
 * @constructor
 * @implements {recoil.db.Database}
 * @param {recoil.frp.Frp} frp the associated FRP engine
 * @param {recoil.db.DatabaseComms} dbComs the interface to get and set data to the backend
 */

recoil.db.ReadWriteDatabase = function (frp, dbComs) {
  this.frp_ = frp;
  this.comms_ = dbComs;
  this.readDb_ = new recoil.db.ReadOnlyDatabase(frp, dbComs);  
  this.dirty_ = [];
};

/**
 * @template T
 * @param {string} id the id of the object to get
 * @param {...*} var_paramters the parameters to the get function, this can be usesful if you want to get something like
 *            a particular id
 * @return recoil.frp.Behaviour<T>
 */
recoil.db.prototype.get = function (id, var_parameters)  {
    var readB = this.readDb_.get.apply(this.readDb_, arguments);
    var changeB = this.frp_.createMetaB(recoil.frp.BStatus.notReady());
    
    return this.frp_.metaLiftBI(function (read, change) {
        if (change.ready()) {
            return changed;
        }
        return read;
    }, function (val) {
       changeB.metaSet(val);
    }, readB, changeB);
};

