goog.provide('recoil.ui.widgets.table.TableWidget');
goog.provide('recoil.ui.widgets.table.TableMetaData');
goog.provide('recoil.ui.widgets.table.Column');


goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRow');
goog.require('recoil.ui.ComponentWidgetHelper');


/**
 * @constructor
 * @implements recoil.ui.AttachableWidget
 */
recoil.ui.widgets.table.TableWidget = function(scope) {
    this.scope_ = scope;
    
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.table_, this, this.updateState_);

    
};


recoil.ui.widgets.table.TableWidget.prototype.updateState_ = function (helper, tableB) {
    var me = this;
    if (helper.isGood()) {
        // TODO this is just me thinking at the moment this needs to do a difference
        // not just build table 
        var table = tableB.get();
        var tableMeta = table.getTableMeta();
        var tableDecorator = this.getMetaValue('tableDecorator', tableMeta);

        
        var tableComponent = tableDecorator.create();
        var headerRowDecorator = this.getMetaValue('headerRowDecorator', tableMeta).create();

       
        if (headerRowDecorator) {
            //this allows the no header on a table the header row decorator returns false

            // build the column header

            table.forEachColumn(function (columnMeta) {
                var columnHeaderDecorator = this.getMetaValue('headerDecorator', tableMeta, columnMeta);
            

                var headerContainer = columnHeaderDecorator.create();
                
                tableComponent.addChild(headerContainer);
                // create a widget of the header
                
            });
        }

        table.forEach(function (row, rowKey, rowMeta) {
            // do this in order of the columns defined in the meta data
            var rowDecorator = this.getMetaValue('rowDecorator', tableMeta, rowMeta);
            var rowComponent = rowDecorator.create();

            tableComponent.addChild(rowComponent.outer);

            table.forEachColumn(function (columnMeta) {
                var cellDecorator = this.getMetaValue('cellDecorator', tableMeta, rowMeta, columnMeta);
                var cellFactory = this.getMetaValue('widgetFactory', tableMeta, rowMeta, columnMeta);
                var cellComponent = cellComponent.create();
                rowComponent.inner.addChild(cellComponent.outer);
                cellFactory.create(cellComponent.inner, recoil.frp.structs.table.CellValue.create(me.frp_, table, rowKey, columnMeta.key));
            });
        });
    }
    else {
        // display error or not ready state
        }
};

recoil.ui.widgets.table.TableWidget.prototype.getComponent = function () {
    
};


recoil.ui.widgets.table.TableWidget.prototype.attachStruct = function () {
};
/**
 * @param {recoil.ui.Behaviour<recoil.structs.table.Table> | recoil.structs.table.Table} table
 * @param {recoil.ui.Behaviour<recoil.ui.widgets.TableMetaData> |recoil.ui.widgets.TableMetaData} meta
 */
recoil.ui.widgets.table.TableWidget.prototype.attach = function (table, meta) {
    
    var util = new recoil.frp.Util(this.frp);
    
    table = util.toBehaviour(table);
    meta = util.toBehaviour(table);
    
    var complete = this.frp.liftBI(function() {return meta.get().applyMeta(table.get());}, function(val) {table.set(val);}, table, meta);

    

};
/**
 * @interface
 * @template T
 */
recoil.ui.widgets.table.Column = function () {
};
/**
 * @param {Object} curMeta
 */
recoil.ui.widgets.table.Column.prototype.getMeta = function (curMeta) {
    
};


/**
 * @constructor
 * @template T
 * @implements {recoil.ui.widgets.table.Constructor}
 */
recoil.ui.widgets.table.DefaultColumn = function (key, name) {
    this.name_ = name;
    this.key_ = key;
};
/**
 * @param {Object} curMeta
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getMeta = function (curMeta) {
    xxx
};


/**
 * @brief data that describes the table, it contains the columns and how to contruct the render widget
 * for that column
 * @constructor
 */
recoil.ui.widgets.TableMetaData = function() {
    this.columns_ = [];
};

/**
 * @template CT
 * @param {recoil.structs.table.Column<CT>} col
 */
recoil.ui.widgets.TableMetaData.prototype.addColumn = function (col) {
    this.columns_.push(col);
};

/**
 *
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} key
 * @param {String} name
 */
recoil.ui.widgets.TableMetaData.prototype.add = function (key, name) {
    this.add(new recoil.ui.widgets.table.DefaultColumn(key, name));
};
/**
 * @nosideeffects
 * @param {recoil.structs.table.Table} table
 * @return {recoil.structs.table.Table}
 */
recoil.ui.widgets.TableMetaData.prototype.applyMeta = function (table) {
    var mtable = table.unfreeze();
    this.columns_.forEach(function (col) {
        mtable.setColumnMeta(col.getKey(), col.getMeta(mtable.getColumnMeta(col.getKey())));
    });
        
    return mtable.freeze();
};
