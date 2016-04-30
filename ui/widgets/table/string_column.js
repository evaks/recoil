goog.provide('recoil.ui.widgets.table.StringColumn');

goog.require('recoil.ui.widgets.table.Column');


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

recoil.ui.widgets.table.StringColumn.defaultWidgetFactory_ = function() {};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.StringColumn.prototype.getKey = function() {
    return this.key_;
};
