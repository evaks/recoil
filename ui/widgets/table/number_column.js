goog.provide('recoil.ui.widgets.table.NumberColumn');

goog.require('recoil.ui.widgets.table.Column');

/**
 *
 * @param meta
 * @constructor
 */
recoil.ui.widgets.table.NumberColumn = function (meta) {
    console.log(meta);
    this.meta_ = meta;
};

recoil.ui.widgets.table.NumberColumn.prototype.test = function () {
    console.log("hello");
};