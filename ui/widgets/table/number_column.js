goog.provide('recoil.ui.widgets.table.NumberColumn');

goog.require('recoil.ui.widgets.table.Column');

/**
 *
 * @param {recoil.structs.table.ColumnKey} key
 * @param {string} name
 * @param {number} min
 * @param {number} max
 * @constructor
 */
recoil.ui.widgets.table.NumberColumn = function(key, name, min, max) {
    this.key_ = key;
};

