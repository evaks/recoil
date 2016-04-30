goog.provide('recoil.ui.widgets.table.StringColumn');

goog.require('recoil.ui.widgets.table.Column');
goog.require('recoil.ui.widgets.InputWidget');
goog.require('recoil.ui.BoolWithExplaination');
goog.require('recoil.frp.struct');


/**
 * @implements {recoil.ui.widgets.table.Column}
 * @template T
 */
recoil.ui.widgets.table.StringColumn = function(key, name, maxChars, editable) {
    this.meta_ = recoil.util.object.removeUndefined(
	{maxChars: maxChars,
	 editable: editable === undefined ? true : editable});
    this.key_ = key;
    this.name_ = name;
};

/**
 * adds all the meta information that a column should need
 * this should at least include cellWidgetFactory
 * other meta data can include:
 *   headerDecorator
 *   cellDecorator
 * and anything else specific to this column such as options for a combo box
 *
 * @nosideeffects
 * @param {Object} curMeta
 * @return {Object}
 */
recoil.ui.widgets.table.StringColumn.prototype.getMeta = function(curMeta) {
    var meta = {name: this.name_,
		cellWidgetFactory: recoil.ui.widgets.table.StringColumn.defaultWidgetFactory_};

    goog.object.extend(meta, this.meta_, curMeta);
    return meta;
};

/**
 * @param {recoil.ui.WidgetScope} scope
 * @param {recoil.frp.Behavour<recoil.structs.table.TableCell>} cell
 * @return {recoil.ui.Widget}
 */
recoil.ui.widgets.table.StringColumn.defaultWidgetFactory_ = 
    function(scope, cellB) 
{
    var frp = scope.getFrp();
    var widget = new recoil.ui.widgets.InputWidget(scope);
    var value = recoil.frp.table.TableCell.getValue(frp, cellB);

    var meta = recoil.frp.table.TableCell.getMeta(frp, cellB);
    
            
    widget.attach("", value, 
                  recoil.frp.struct.get('enabled', meta, recoil.ui.BoolWithExplaination));
    return widget;
};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.StringColumn.prototype.getKey = function() {
    return this.key_;
};
