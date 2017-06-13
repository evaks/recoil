goog.provide('recoil.ui.widgets.TableMetaData');
goog.provide('recoil.ui.widgets.table.DefaultColumn');

goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.structs.table.Table');

/**
 * data that describes the table, it contains the columns and how to contruct the render widget
 * for that column
 * @constructor
 */
recoil.ui.widgets.TableMetaData = function() {
    this.columns_ = [];
};

/**
 * @template CT
 * @param {!recoil.ui.widgets.table.Column<CT>} col
 */
recoil.ui.widgets.TableMetaData.prototype.addColumn = function(col) {
    if (!col) {
        throw 'undefined column';
    }
    this.columns_.push(col);
};

/**
 * @param {!function(recoil.structs.table.ColumnKey,recoil.ui.widgets.table.Column)} func
 */
recoil.ui.widgets.TableMetaData.prototype.forEachColumn = function(func) {
    this.columns_.forEach(function(col) {
        func(col.getKey(), col);
    });
};
/**
 *
 * @template CT
 * @param {!recoil.structs.table.ColumnKey<CT>} key
 * @param {string} name
 * @param {!Object=} opt_meta
 */
recoil.ui.widgets.TableMetaData.prototype.add = function(key, name, opt_meta) {
    if (!key) {
        throw 'undefined column key';
    }

    this.addColumn(new recoil.ui.widgets.table.DefaultColumn(key, name, opt_meta || {}));
};

/**
 * @param {recoil.structs.table.Table} table
 * @return {recoil.structs.table.Table}
 */
recoil.ui.widgets.TableMetaData.prototype.applyMeta = function(table) {
    var mtable = table.unfreeze();
    var pos = 0;
    this.columns_.forEach(function(col) {
        var inMeta = {};
        goog.object.extend(inMeta, table.getMeta(), mtable.getColumnMeta(col.getKey()));
        var meta = col.getMeta(inMeta);
        if (meta.position === undefined) {
            meta.position = pos;
        }
        mtable.setColumnMeta(col.getKey(), meta);
        pos++;
    });
    return mtable.freeze();
};
/**
 * return all the haviours containted in this meta data structure
 * @return {!Array<!recoil.frp.Behaviour>}
 */
recoil.ui.widgets.TableMetaData.prototype.getBehaviours = function() {
    return recoil.frp.struct.getBehaviours(this);
};
/**
 * creates a behaviour that contains TableMetaData
 * @param {!recoil.frp.Frp} frp
 * @return {!recoil.frp.Behaviour<!Object>}
 */
recoil.ui.widgets.TableMetaData.prototype.createB = function(frp) {
    return recoil.frp.struct.flatten(frp, this);
};

/**
 * @constructor
 * @template T
 * @param {recoil.structs.table.ColumnKey} key
 * @param {string} name
 * @param {!Object=} opt_meta
 * @implements {recoil.ui.widgets.table.Column}
 */
recoil.ui.widgets.table.DefaultColumn = function(key, name, opt_meta) {
    this.name_ = name;
    this.key_ = key;
    this.meta_ = opt_meta || {};
};

/**
 * @param {Object} curMeta
 * @return {Object}
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getMeta = function(curMeta) {
    /**
     * @type {Object<string, *>}
     */
    var meta = {name: this.name_};
    goog.object.extend(meta, this.meta_, curMeta);

    var factoryMap = meta['typeFactories'];
    var factory = (factoryMap === undefined || meta.type === undefined)
            ? undefined : factoryMap[meta.type];
    var column = factory === undefined
            ? undefined : factory(this.key_, meta.name);

    if (column === undefined) {
        column = new recoil.ui.widgets.table.StringColumn(this.key_, meta.name);
    }
    return column.getMeta(meta);
};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getKey = function() {
    return this.key_;
};
