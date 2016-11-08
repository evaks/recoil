goog.provide('recoil.db.Database');
goog.provide('recoil.db.ReadOnlyDatabase');
goog.provide('recoil.db.ReadWriteDatabase');
goog.provide('recoil.db.error');

goog.require('goog.structs.AvlTree');
goog.require('recoil.frp.ChangeManager');
goog.require('recoil.util');
goog.require('recoil.db.Type');
goog.require('recoil.db.DatabaseComms');
goog.require('recoil.db.ObjectManager');
goog.require('recoil.frp.Debug');

/**
 * @interface
 */
recoil.db.Database = function() {
};

/**
 * @param {!IArrayLike} values
 * @return {!Object}
 */
recoil.db.Database.prototype.makeKey = function(values) {
};

/**
 * gets an individual object from the database
 * @template T
 * @param {!recoil.db.Type<T>} id an id to identify the type of object you want
 * @param {!Array<?>} primaryKeys primary keys of the object you want to get
 * @param {recoil.db.QueryOptions=} opt_options extra option to the query such as poll rate or notify
 * @return {!recoil.frp.Behaviour<T>} the corisponding object 
 */
recoil.db.Database.prototype.get = function(id, primaryKeys, opt_options) {
};


/**
 * @constructor
 * @implements {recoil.db.Database}
 * @param {recoil.frp.Frp} frp the associated FRP engine
 * @param {recoil.db.ReadWriteDatabase} db
 */
recoil.db.ReadOnlyDatabase = function(frp, db) {
    this.frp_ = frp;
    this.db_ = db;
};

/**
 * @param {!IArrayLike} values
 * @return {!Object}
 */
recoil.db.ReadOnlyDatabase.prototype.makeKey = function(values) {
    return this.db_.makeKey(values);
};

/**
 * gets an individual object from the database
 * @template T
 * @param {!recoil.db.Type<T>} id an id to identify the type of object you want
 * @param {!Array<?>} primaryKeys primary keys of the object you want to get
 * @param {recoil.db.QueryOptions=} opt_options extra option to the query such as poll rate or notify
 * @return {!recoil.frp.Behaviour<T>} the corisponding object 
 */
recoil.db.ReadOnlyDatabase.prototype.get = function(id, primaryKeys, opt_options) {
    return this.frp_.liftB(function (v) {return v.getStored();}, this.db_.getSendInfo(id, primaryKeys, opt_options));
};

/**
 *
 * @param {string} id
 * @param {...*} var_parameters
 * @return {*}
 * @private
 */
recoil.db.ReadOnlyDatabase.prototype.getInternal_ = function(id, var_parameters) {
    //TODO
    throw 'not implemented yet';

};


/**
 * @constructor
 * @implements {recoil.db.Database}
 * @param {!recoil.frp.Frp} frp the associated FRP engine
 * @param {!recoil.db.DatabaseComms} dbComs the interface to get and set data to the backend
 */

recoil.db.ReadWriteDatabase = function(frp, dbComs) {
    this.frp_ = frp;
    this.comms_ = dbComs;
    this.objectManager_ = new recoil.db.ObjectManager(frp);
};


/**
 * @param {!IArrayLike} values
 * @return {!Object}
 */
recoil.db.ReadWriteDatabase.prototype.makeKey = function(values) {
    return this.comms_.makeKey(values);
};

/**
 * @private
 * @param {recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<recoil.db.SendInfo>} uniq
 */
recoil.db.ReadOnlyDatabase.filterSending_ = function (frp, uniq) {
    return frp.liftB(
        function (val) {
            return val.getStored();
        },uniq);

};

/**
 * @private
 * @param {recoil.frp.Frp} frp
 * @param {!recoil.frp.Behaviour<!recoil.db.SendInfo>} uniq
 */
recoil.db.ReadWriteDatabase.showSending_ = function (frp, uniq) {
    return frp.liftBI(
        function (val) {
            return val.getSending() ? val.getSending() : val.getStored();
        },
        function (val) {
            uniq.set(uniq.get().setSending(val));
        }, uniq);
};
/**
 * gets an individual object from the database, this is really for internal use only
 * it seperates 
 * @template T
 * @param {!recoil.db.Type<T>} id an id to identify the type of object you want
 * @param {!Array<?>} primaryKeys primary keys of the object you want to get
 * @param {recoil.db.QueryOptions=} opt_options extra option to the query such as poll rate or notify
 * @return {!recoil.frp.Behaviour<!recoil.db.SendInfo<T>>} the corisponding object 
 */
recoil.db.ReadWriteDatabase.prototype.getSendInfo = function(id, primaryKeys, opt_options)  {
    var valueB = this.frp_.createNotReadyB();
    var dbComs = this.comms_;
    var objectManager = this.objectManager_;
    var frp = this.frp_;
    var options = opt_options || new recoil.db.QueryOptions();
    
    valueB.refListen(
        function (used) {
            frp.accessTrans(function () {
                if (used) {
                    var uniq = objectManager.register(id, primaryKeys, options , dbComs);
                    valueB.set(uniq);
                }
                else {
                    objectManager.unregister(id, primaryKeys, options, dbComs);
                    valueB.metaSet(recoil.frp.BStatus.notReady());
                }
            }, valueB);
        });
    return frp.switchB(valueB);
};


/**
 * gets an individual object from the database
 * @template T
 * @param {!recoil.db.Type<T>} id an id to identify the type of object you want
 * @param {!Array<?>} primaryKeys primary keys of the object you want to get
 * @param {recoil.db.QueryOptions=} opt_options extra option to the query such as poll rate or notify
 * @return {!recoil.frp.Behaviour<T>} the corisponding object 
 */
recoil.db.ReadWriteDatabase.prototype.get = function(id, primaryKeys, opt_options)  {
    return recoil.db.ReadWriteDatabase.showSending_(this.frp_, this.getSendInfo(id, primaryKeys, opt_options));
};

/**
 * A database that will not send data to the server until an event is sent to
 * @constructor
 * @param {recoil.frp.Frp}   frp
 * @param {recoil.db.Database} source
 * @implements {recoil.db.Database}
 */

recoil.db.DelayedDatabase = function(frp, source) {
    this.source_ = source;
    this.frp_ = frp;
    this.changed_ = new goog.structs.AvlTree(function (x, y) {return recoil.util.compare(x.key, y.key);});
    /**
     * @private 
     * @type !recoil.frp.Behaviour<recoil.frp.ChangeManager.Action>
     */
    this.changeEvent_ = frp.createE();
};



/**
 * Returns a behaviour, with a value that we can get, set etc
 * @template T
 * @param {!recoil.db.Type<T>} id an id to identify the type of object you want
 * @param {!Array<?>} primaryKeys primary keys of the object you want to get
 * @param {recoil.db.QueryOptions=} opt_options extra option to the query such as poll rate or notify
 * @return {!recoil.frp.Behaviour<T>} the corisponding object 
 */

recoil.db.DelayedDatabase.prototype.get = function(id, primaryKeys, opt_options) {  

    var key = this.source_.makeKey(arguments);
    var frp = this.frp_;
    var changedIn = frp.createB(frp.createMetaB(recoil.frp.BStatus.notReady()));
    var changedOut = frp.switchB(changedIn);
    (function(frp, changed, key) {
        changedOut.refListen(function(hasRef) {
            var changedVal = changed.findFirst({key: key});
            if (hasRef) {
                frp.accessTrans(function() {
                    if (changedVal) {
                        changedVal.refs++;
                        if (changedIn.get() !== changedVal.value) {
                            changedIn.set(changedVal.value);
                        }
                    }
                    else {
                        changed.add({key: key, refs: 1, value: changedIn.get()});
                    }
                }, changedIn);
            }
            else {
                if (changedVal) {
                    changedVal.refs--;
                    // TODO would really like to remove from the changed map only if there are not changes
                    if (changedVal.refs === 0 && !changedVal.value.ready()) {
                        changed.remove(changedVal);
                    }
                }
            }
        });
    })(this.frp_, this.changed_, key);

    var databaseB = this.source_.get.apply(this.source_, arguments);

    return recoil.frp.ChangeManager.create(frp, databaseB, changedOut, this.changeEvent_);
};

/**
 * writes all the data out to the database
 */
recoil.db.DelayedDatabase.prototype.flush = function () {
    var me = this;
    this.frp_.accessTrans(function () {
        me.changeEvent_.set(recoil.frp.ChangeManager.Action.FLUSH);
    }, this.changeEvent_);
};


/**
 * loose all the changes
 */
recoil.db.DelayedDatabase.prototype.clear = function () {
    var me = this;
    this.frp_.accessTrans(function () {
        me.changeEvent_.set(recoil.frp.ChangeManager.Action.CLEAR);
    }, this.changeEvent_);
};

/**
 * @param {!IArrayLike} values
 * @return {!Object}
 */
recoil.db.DelayedDatabase.prototype.makeKey = function(values) {
    return this.source_.makeKey(values);
};


/**
 * defines the database errors
 */
recoil.db.error.NOT_PRESENT = recoil.util.object.constant({name : 'not present'});
    