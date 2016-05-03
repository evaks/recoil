goog.provide('recoil.ui.widgets.table.Column');


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
 * @nosideeffects
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
