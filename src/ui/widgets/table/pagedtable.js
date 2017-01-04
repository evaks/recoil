
/**
 * provides paging functionality for table widget
 */
goog.provide('recoil.ui.widgets.table.PagedTableWidget');
goog.provide('recoil.ui.widgets.table.PagerWidget');
goog.provide('recoil.ui.widgets.table.createNextTablePager');

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
goog.require('recoil.ui.messages');
goog.require('recoil.ui.widgets.LabelWidget');
goog.require('recoil.ui.widgets.TableMetaData');
goog.require('recoil.ui.widgets.table.Column');
goog.require('recoil.ui.widgets.table.StringColumn');
goog.require('recoil.ui.widgets.table.TableWidget');

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

    this.topPager_ = new recoil.ui.widgets.table.PagerWidget(scope);
    this.bottomPager_ = new recoil.ui.widgets.table.PagerWidget(scope);


    var tableDiv = goog.dom.createDom('div');
    this.tableWidget_.getComponent().render(tableDiv);

    var div = goog.dom.createDom('div', {class: 'recoil-table-pager-container'});

    this.container_.getElement().appendChild(div);
    div.appendChild(this.topPager_.getComponent().getElement());
    div.appendChild(tableDiv);
    div.appendChild(this.bottomPager_.getComponent().getElement());

    var me = this;



};


/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.table.PagedTableWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.table.PagedTableWidget.prototype.getComponent = function() {
    return this.container_;
};


/**
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table> | !recoil.structs.table.Table} table
 * @param {!recoil.frp.Behaviour<!recoil.ui.widgets.TableMetaData> |!recoil.ui.widgets.TableMetaData} meta
 * @param {!recoil.frp.Behaviour<!number>} page
 * @param {!recoil.frp.Behaviour<!number>|!number} count
 */
recoil.ui.widgets.table.PagedTableWidget.prototype.attach = function(table, meta, page, count) {
    this.tableWidget_.attach(table, meta);
    this.topPager_.attach(page, count);
    this.bottomPager_.attach(page, count);
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


/**
 * @constructor
 * @param {!recoil.ui.WidgetScope} scope
 * @implements recoil.ui.Widget
 */
recoil.ui.widgets.table.PagerWidget = function(scope) {
    this.scope_ = scope;
    this.container_ = new goog.ui.Component();
    this.container_.createDom();
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);
    var me = this;

    this.first_ = goog.dom.createDom('a', {
        class: 'first'},'\u00ab');
    this.last_ = goog.dom.createDom('a', {
        class: 'last'},'\u00bb');
    this.next_ = goog.dom.createDom('a', {
        class: 'next'},'\u203A');
    this.prev_ = goog.dom.createDom('a', {
        class: 'previous'},'\u2039');

    var selectPage = goog.dom.createDom('input', {
        type: 'text',
        class: 'page'
    });

    var container = goog.dom.createDom('table', {
        class: 'recoil-table-pager pagination'
    });

    this.pageInput_ = selectPage;

    var row = goog.dom.createDom('div', {class: 'row'});

    selectPage.onblur = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    var val = parseInt(selectPage.value, 10);

                    if (val + '' === selectPage.value && val > 0 && val <= me.countB_.get()) {
                        me.pageB_.set(val);
                    }
                }
                me.updateInfo_();
            }, me.pageB_, me.countB_);

    };
    selectPage.onfocus = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    selectPage.value = me.pageB_.get();
                    selectPage.setSelectionRange(0, selectPage.value.length);
                }
            }, me.pageB_, me.countB_);
    };

    this.last_.onclick = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    me.pageB_.set(me.countB_.get());
                }
            }, me.pageB_, me.countB_);
    };

    this.first_.onclick = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    me.pageB_.set(1);
                }
            }, me.pageB_, me.countB_);
    };

    this.prev_.onclick = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    if (me.pageB_.get() > 1) {
                        me.pageB_.set(me.pageB_.get() - 1);
                    }
                }
            }, me.pageB_, me.countB_);
    };

    this.next_.onclick = function() {
        me.scope_.getFrp().accessTrans(
            function() {
                if (me.helper_.isGood()) {
                    if (me.pageB_.get() < me.countB_.get()) {
                        me.pageB_.set(me.pageB_.get() + 1);
                    }
                }
            }, me.pageB_, me.countB_);
    };

    container.appendChild(row);

    row.appendChild(this.first_);
    row.appendChild(this.prev_);
    row.appendChild(selectPage);
    row.appendChild(this.next_);
    row.appendChild(this.last_);

    this.container_.getElement().appendChild(container);
};


/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.ui.widgets.table.PagerWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.table.PagerWidget.prototype.getComponent = function() {
    return this.container_;
};


/**
 * @param {!recoil.frp.Behaviour<!number>} page the page that need to be displayed, must be behaviour otherwise
 8                                              we can't change the page
 * @param {!recoil.frp.Behaviour<!number> |!number} count
 */
recoil.ui.widgets.table.PagerWidget.prototype.attach = function(page, count) {
    var util = new recoil.frp.Util(this.scope_.getFrp());

    this.pageB_ = page;
    this.countB_ = util.toBehaviour(count);
    this.helper_.attach(page, this.countB_);
};

/***
 * helper to mark buttons disabled
 * @private
 * @param {boolean} disabled
 * @param {...Element} var_items
 */
recoil.ui.widgets.table.PagerWidget.prototype.disable_ = function(disabled, var_items) {

    for (var i = 1; i < arguments.length; i++) {
        var item = arguments[i];
        if (disabled) {
            goog.dom.classlist.add(item, 'disabled');
        }
        else {
            goog.dom.classlist.remove(item, 'disabled');
        }
    }
};

/**
 * updates the info in the table widget
 * @private
 */

recoil.ui.widgets.table.PagerWidget.prototype.updateInfo_ = function() {
    if (this.helper_.isGood()) {
        this.pageInput_.value = recoil.ui.messages.PAGE_X_OF_Y.resolve(
            { x: this.pageB_.get(), y: this.countB_.get() }).toString();
        var c = this.countB_.get();
        var p = this.pageB_.get();
        var enabled = c > 1;
        this.pageInput_.disabled = !enabled;
        this.disable_(!enabled || p === 1, this.first_, this.prev_);
        this.disable_(!enabled || p === c, this.last_, this.next_);
        this.pageInput_.disabled = !enabled;
    }
    else {
        this.pageInput_.disabled = true;
        this.disable_(true, this.first_, this.prev_, this.last_, this.next_);
        this.pageInput_.value = recoil.ui.messages.PAGE_X_OF_Y.resolve(
            { x: this.pageB_.metaGet().good() ? this.pageB_.get() : recoil.ui.messages.__UNKNOWN_VAL,
              y: this.countB_.metaGet().good() ? this.countB_.get() : recoil.ui.messages.__UNKNOWN_VAL}).toString();
    }
};

/**
 * updates the display in the pager widget
 * @private
 */
recoil.ui.widgets.table.PagerWidget.prototype.updateState_ = function() {
    var enabled = this.helper_.isGood();
    if (this.helper_.isGood()) {
        if (this.pageInput_ !== document.activeElement) {
            this.updateInfo_();
        }
    }
    else {
        this.updateInfo_();
    }

};

/**
 * a pager that takes a table with 2 extra rows
 * @param {!recoil.frp.Behaviour<!recoil.structs.table.Table>} tableB table to be paged, it should contain an extra row for before and after (if it exists)
 * @param {!recoil.frp.Behaviour<Object>} keyB an object specifies to do nextcan be null - first, page: _, prev: row, next: row
 * @param {!recoil.frp.Behaviour<!number>|!number} pageSize size of a page
 * @param {!recoil.frp.Behaviour<!number>|!number} tableSize size of the entire table
 * @return {{page:!recoil.frp.Behaviour<!number>,table: !recoil.frp.Behaviour<!recoil.structs.table.Table>, count : !recoil.frp.Behaviour<!number>}}
 */

recoil.ui.widgets.table.createNextTablePager = function(tableB, keyB, pageSize, tableSize) {
    var frp = tableB.frp();
    var util = new recoil.frp.Util(tableB.frp());
    var pageSizeB = util.toBehaviour(pageSize);
    var tableSizeB = util.toBehaviour(tableSize);
    var memoryB = frp.createB(1);

    var rememberPageB = tableB.frp().liftBI(
        function()  {
            return {orig: memoryB.get(), val: memoryB.get()};
        },
        function(val) {
            var table = tableB.get();
            var first = null;
            var last = null;
            table.forEach(function(row) {
                first = first || row;
                last = row;
            });

            if (val.orig + 1 === val.val) {
                // value has increased by 1 just get the next page
                if (table.size() > pageSizeB.get() + 1 && last) {
                    keyB.set({next: last});
                    memoryB.set(val.val);
                }
            }
            else if (val.val === 1) {
                // we want the first page no need for a key
                keyB.set(null);
                memoryB.set(val.val);
            }
            else if (val.orig - 1 === val.val) {
                // went back 1 use prev
                keyB.set({prev: first});
                memoryB.set(val.val);
            }
            else {
                // random page just get that
                keyB.set({page: val.val});
                memoryB.set(val.val);
            }
        }, tableB, keyB, memoryB);

    var pageB = frp.liftBI(
        function() {
            return rememberPageB.get().val;
        },
        function(val) {
            rememberPageB.set({orig: rememberPageB.get().orig, val: val});
        }, rememberPageB);
    // this filters out the first and last row if necessary
    var outTableB = frp.liftBI(
        function(table, page, count) {
            var res = table.createEmpty();
            var curRow = 0;
            table.forEach(function(row) {
                var max = page === 1 ? count : count + 1;
                if ((page === 1 && curRow === 0) || (curRow !== 0 && curRow < max)) {
                    res.addRow(row);
                }
                curRow++;
            });
            return res.freeze();
        },
        function(val) {
            var res = tableB.get().createEmpty();
            var rowPos = 0;
            var page = memoryB.get();
            var count = pageSizeB.get();
            // add first row used for pager
            if (page !== 0) {
                tableB.get().forEach(function(row) {
                    if (rowPos === 0) {
                        res.addRow(row);
                    }
                    rowPos++;
                });
            }

            // add the data for the output rows
            val.forEach(function(row) {
                res.addRow(row);
            });

            rowPos = 0;
            var max = page === 1 ? count : count + 1;
            tableB.get().forEach(function(row) {
                if (rowPos >= max) {
                    res.addRow(row);
                }
                rowPos++;
            });


        }, tableB, memoryB, pageSizeB);

    return {
        table: outTableB,
        page: pageB,
        count: frp.liftB(function (size, pageSize) {
            return Math.ceil(size/pageSize);
        }, tableSizeB, pageSizeB)
    };
};
