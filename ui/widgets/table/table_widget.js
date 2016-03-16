goog.provide('recoil.ui.widgets.table.TableWidget');
goog.provide('recoil.ui.widgets.table.TableMetaData');
goog.provide('recoil.ui.widgets.table.Column');

goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.structs.Table');
goog.require('recoil.structs.TableRow');



/**
 * @constructor
 * @implements recoil.ui.AttachableWidget
 */
recoil.ui.widgets.table.TableWidget = function() {
    
};

recoil.ui.widgets.table.TableWidget.prototype.getComponent = function () {
    
};


recoil.ui.widget.table.TableWidget.prototype.attachStruct = function () {
};
/**
 * @param {recoil.ui.Behaviour<recoil.structs.Table> | recoil.structs.Table} table
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

recoil.ui.widgets.TableMetaData.prototype.addColumn = function (col) {
    this.columns_.push(col);
};

