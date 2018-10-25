/**
 * a utility to remember the order of a table
 */
goog.provide('recoil.structs.table.Order');

goog.require('goog.structs.AvlTree');
goog.require('recoil.structs.table.Table');

/**
 * @constructor
 */
recoil.structs.table.Order = function() {
    this.todo_ = [];
    this.pos_ = 0;
};


/**
 * call this before adding rows in order to previously added state
 */
recoil.structs.table.Order.prototype.start = function() {
    this.todo_ = [];
    this.pos_ = 0;
};

/**
 * @param {!recoil.structs.table.MutableTableRow|!recoil.structs.table.TableRow} row
 */
recoil.structs.table.Order.prototype.addRow = function(row) {

    this.todo_.push(row instanceof recoil.structs.table.MutableTableRow ? row : row.unfreeze());
};


/**
 * @param {!Array<recoil.structs.table.ColumnKey>} keys
 */
recoil.structs.table.Order.prototype.rememberStart = function(keys) {
    this.keys_ = keys;
    this.pos_ = 0;
    var comparator = function(a, b) {
        for (var i = 0; i < keys.length; i++) {
            var col = keys[i];
            var res = col.valCompare(a.keys[i], b.keys[i]);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    };

    this.order_ = new goog.structs.AvlTree(comparator);
};

/**
 * @private
 * @param {recoil.structs.table.TableRowInterface} row
 * @return {!Array}
 */
recoil.structs.table.Order.prototype.getKeys_ = function(row) {
    return this.keys_.map(function(k) {return row.get(k);});
};

/**
 * @param {!recoil.structs.table.TableRowInterface} row
 */
recoil.structs.table.Order.prototype.remember = function(row) {
    this.order_.add({keys: this.getKeys_(row), pos: this.pos_++});
};

/**
 * adds the rows in order to the table
 * @param {!recoil.structs.table.MutableTable} table
 */
recoil.structs.table.Order.prototype.apply = function(table) {
    var notFoundPos = this.order_ ? this.order_.getCount() : 0;
    var me = this;
    this.todo_.forEach(function(r) {
        var entry = me.order_ && me.order_.findFirst({keys: me.getKeys_(r)});
        if (entry) {
            r.setPos(entry.pos);
        }
        else {
            r.setPos(notFoundPos++);
        }
        table.addRow(r);
    });
    this.todo_ = [];
};


