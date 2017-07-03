goog.provide('recoil.ui.widgets.table.Column');
goog.provide('recoil.ui.widgets.table.makeStructColumn');

goog.require('recoil.structs.table.ColumnKey');
goog.require('recoil.ui.Widget');
goog.require('recoil.ui.WidgetScope');
/**
 * @interface
 * @template T
 */
recoil.ui.widgets.table.Column = function() {
};
/**
 * adds all the meta information that a column should need
 * this should at least include cellWidgetFactory
 * other meta data can include:
 *   headerDecorator
 *   cellDecorator
 * and anything else specific to this column such as options for a combo box
 *
 * @param {Object} curMeta
 * @return {Object}
 */
recoil.ui.widgets.table.Column.prototype.getMeta = function(curMeta) {

};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.Column.prototype.getKey = function() {

};


/**
 * a utility to make a column that attaches to a widget
 * that has the interface of
 * create = new Widget(scope)
 * attachStruct = function ({value:*,...})
 * @template T
 * @param {function (new:recoil.ui.Widget,T):undefined} widgetCons
 * @return {function(!recoil.structs.table.ColumnKey,string)}
 */
recoil.ui.widgets.table.makeStructColumn = function(widgetCons) {
    var factory = function(scope, cellB) {
        var frp = scope.getFrp();
        var widget = new widgetCons(scope);
        var value = recoil.frp.table.TableCell.getValue(frp, cellB);


        var metaData = recoil.frp.table.TableCell.getMeta(frp, cellB);
        widget.attachStruct(recoil.frp.struct.extend(frp, metaData, {value: value}));
        return widget;
    };
    /**
     * @constructor
     * @param {!recoil.structs.table.ColumnKey} column
     * @param {string} name
     * @implements {recoil.ui.widgets.table.Column}
     */
    var res = function(column, name) {
        this.key_ = column;
        this.name_ = name;
    };

    res.prototype.getMeta = function(curMeta) {
        var meta = {name: this.name_,
                    cellWidgetFactory: factory};
        goog.object.extend(meta, curMeta);
        return meta;
    };

    /**
     * @return {recoil.structs.table.ColumnKey}
     */
    res.prototype.getKey = function() {
        return this.key_;
    };

    return res;
};
