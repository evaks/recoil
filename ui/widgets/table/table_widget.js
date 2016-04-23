goog.provide('recoil.ui.widgets.table.TableWidget');
goog.provide('recoil.ui.widgets.table.TableMetaData');
goog.provide('recoil.ui.widgets.table.Column');

goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRow');



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
    
};
/**
 * @interface
 * @template T
 */
recoil.ui.widgets.table.Column = function () {
};
/**
 * @brief constructs a widget and attaches the data to it
 *
 * @param {recoil.ui.WidgetScope} scope 
 * @param {recoil.frp.Behaviour<T>} data the value to be entered, displayed
 * @param {recoil.frp.Behaviour<*>} metaData extra information that may be used to render the widget
 * @param {?recoil.ui.Widget} oldWidget the old widget that already exists, if no need to change then the function should return this
 * @return recoil.ui.Widget, return a widget with the data already attached
 */
recoil.ui.widgets.table.Column.prototype.createWidget = function (scope, data, metaData, oldWidget){
};

/**
 * @brief constructs a widget to display the table header
 *
 * @param {recoil.ui.WidgetScope} scope 
 * @param {recoil.frp.Behaviour<T>} data the value to be entered, displayed
 * @param {recoil.frp.Behaviour<*>} metaData extra information that may be used to render the widget
 * @param {?recoil.ui.Widget} oldWidget the old widget that already exists, if no need to change then the function should return this
 * @return recoil.ui.Widget, return a widget with the data already attached
 */

recoil.ui.widgets.table.Column.prototype.createHeader = function (scope, data, metaData, oldWidget) {
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
 * @param {recoil.structs.table.ColumnKey<CT>} col
 */
recoil.ui.widgets.TableMetaData.prototype.addColumn = function (col) {
    this.columns_.push(col);
};

/**
 *
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} key
 * @param {String} val
 */
recoil.ui.widgets.TableMetaData.prototype.add = function (key, val) {
    //console.log(key.getName());
    //console.log(val);
};
