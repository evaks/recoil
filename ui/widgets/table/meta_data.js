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
 * @param {recoil.ui.widgets.table.Column<CT>} col
 */
recoil.ui.widgets.TableMetaData.prototype.addColumn = function(col) {
    this.columns_.push(col);
};

/**
 *
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} key
 * @param {string} name
 */
recoil.ui.widgets.TableMetaData.prototype.add = function(key, name) {
    this.addColumn(new recoil.ui.widgets.table.DefaultColumn(key, name));
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
        goog.object.extend(inMeta, table.getMeta(),mtable.getColumnMeta(col.getKey())); 
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
 * @desc return all the haviours containted in this meta data structure
 */
recoil.ui.widgets.TableMetaData.prototype.getBehaviours = function () {
    return recoil.frp.struct.getBehaviours(this);
};
/**
 * @desc creates a behaviour that contains TableMetaData
 */
recoil.ui.widgets.TableMetaData.prototype.createB = function (frp) {
    return recoil.frp.struct.flattern(frp, this);
};

/**
 * @constructor
 * @template T
 * @param {recoil.structs.table.ColumnKey} key
 * @param {string} name
 * @implements {recoil.ui.widgets.table.Column}
 */
recoil.ui.widgets.table.DefaultColumn = function(key, name) {
    this.name_ = name;
    this.key_ = key;
};

/**
 * @param {Object} curMeta
 * @return {Object}
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getMeta = function(curMeta) {
    /**
     * @type Object<string, *>
     */
    var meta = {name: this.name_};
    goog.object.extend(meta, curMeta);

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
