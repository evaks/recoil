
/**
 * provides paging functionality for table widget
 */
goog.provide('recoil.ui.widgets.table.PagedTableWidget');

goog.require('recoil.ui.widgets.table.TableWidget');

goog.require('goog.dom.classes');
goog.require('goog.string');
goog.require('goog.ui.Container');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.table.TableCell');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRow');
goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.ui.BoolWithExplanation');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.RenderedDecorator');
goog.require('recoil.ui.widgets.LabelWidget');
goog.require('recoil.ui.widgets.TableMetaData');
goog.require('recoil.ui.widgets.table.Column');
goog.require('recoil.ui.widgets.table.StringColumn');


/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.table.PagedTableWidget = function(scope) {
    this.scope_ = scope;
    this.container_ = new goog.ui.Component();
    this.container_.createDom();
    this.tableWidget_ = new recoil.ui.widgets.table.TableWidget(scope);
//    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);

    var topPager = recoil.ui.widgets.table.PagedTableWidget.createPager_();
    var bottomPager = recoil.ui.widgets.table.PagedTableWidget.createPager_();
    
    
    var tableDiv = goog.dom.createDom('div');
    this.tableWidget_.getComponent().render(tableDiv);

    var div = goog.dom.createDom('div', {class : 'recoil-table-pager-container'});
    
    this.container_.getElement().appendChild(div);
    div.appendChild(topPager);
    div.appendChild(tableDiv);
    div.appendChild(bottomPager);

    var me = this;

    

};


recoil.ui.widgets.table.PagedTableWidget.createPager_ = function(scope) {
    var first = goog.dom.createDom('td', {},
                                   goog.dom.createDom('a', {
                                       class : 'first'},'\u00ab'));
    var last = goog.dom.createDom('td', {},
            goog.dom.createDom('a', {
                class : 'last'},'\u00bb'));
    var next = goog.dom.createDom('td', {}, goog.dom.createDom('a', {
        class : 'next'},'\u203A'));
    var prev = goog.dom.createDom('td', {},
                                  goog.dom.createDom('a', {
                                      class : 'previous'},'\u2039'));

    var selectPage = goog.dom.createDom('td', {
        type : 'text',
        class : 'page'
    },
                                        goog.dom.createDom('input', {
                                            type : 'text', class : 'page'}));

    
    var container = goog.dom.createDom('table', {
        class : 'recoil-table-pager pagination'
    });

    var row = goog.dom.createDom('tr', {class : 'row'});

    container.appendChild(row);

    row.appendChild(first);
    row.appendChild(prev);
    row.appendChild(selectPage);
    row.appendChild(next);
    row.appendChild(last);

    return container;

};


recoil.ui.widgets.table.PagedTableWidget.prototype.getComponent = function () {
    return this.container_;
};


/**
 * @param {recoil.frp.Behaviour<recoil.structs.table.Table> | recoil.structs.table.Table} table
 * @param {recoil.frp.Behaviour<recoil.ui.widgets.TableMetaData> |recoil.ui.widgets.TableMetaData} meta
 */
recoil.ui.widgets.table.PagedTableWidget.prototype.attach = function(table, meta) {

    this.tableWidget_.attach(table, meta);
};

/**
 * this should be called after the attach this way it can filter out the
 * rows that do not exist in the table.
 *
 * note this is a bidirectional behaviour, so setting it will change the selection
 *
 * @return {recoil.frp.Behaviour<Array<Array<Object>>>}
 */
recoil.ui.widgets.table.PagedTableWidget.prototype.createSelected = function() {
    return this.tableWidget_.createSelected();
};
