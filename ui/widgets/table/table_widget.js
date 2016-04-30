goog.provide('recoil.ui.widgets.table.Column');
goog.provide('recoil.ui.widgets.table.TableMetaData');
goog.provide('recoil.ui.widgets.table.TableWidget');

goog.require('goog.string');
goog.require('goog.ui.Container');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.table.TableCell');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRow');
goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.ui.BoolWithExplaination');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.ui.RenderedDecorator');
goog.require('recoil.ui.widgets.LabelWidget');
goog.require('recoil.ui.widgets.table.StringColumn');

/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 * @implements recoil.ui.AttachableWidget
 */
recoil.ui.widgets.table.TableWidget = function(scope) {
    this.scope_ = scope;
    this.container_ = new goog.ui.Container();
    this.container_.createDom();
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);
    this.state_ = recoil.ui.widgets.table.TableWidget.emptyState_();
    this.renderState_ = {
        rows: new goog.structs.AvlTree(recoil.ui.widgets.table.TableWidget.rowMetaCompare_),
        headerCols: []
    };
};
/**
 * @return {Object}
 * @private
 */
recoil.ui.widgets.table.TableWidget.emptyState_ = function() {
    return {
        rowMeta: new goog.structs.AvlTree(recoil.ui.widgets.table.TableWidget.rowMetaCompare_),
        columnMeta: [],
        tableMeta: {}
    };
};

/**
 * this gets the most relevant value for this field int the meta, it goes backwards
 * through the meta information until it finds the key that it is looking for
 * if it does not find it there it then will check the scope for that value with the name
 * recoil.ui.widgets.table.TableWidget.'value' if it is not there it will then return
 * recoil.ui.widgets.table.TableWidget.default'Value'_ (note the first letter is capitalised)

 * @param {string} value the key of value to get
 * @param {...Object} var_meta all the meta information
 * @return {Object}
 */
recoil.ui.widgets.table.TableWidget.prototype.getMetaValue = function(value, var_meta) {
    var val;

    for (var i = arguments.length - 1; i > 0; i--) {
        var arg = arguments[i];
        if (arg === undefined) {
            console.log('undefined arg');
        } else {
            val = arg[value];
            if (val !== undefined) {
                return val;
            }
        }
    }
    val = recoil.util.object.getByParts(this.scope_, 'recoil', 'ui', 'widgets', 'table', 'TableWidget', value);

    if (val !== undefined) {
        return val;
    }

    return recoil.ui.widgets.table.TableWidget['default' + goog.string.toTitleCase(value) + '_'];
};

/**
 * the default decorator for making tables
 * @final
 * @private
 * @return {recoil.ui.RenderedDecorator}
 */
recoil.ui.widgets.table.TableWidget.defaultTableDecorator_ = function() {
    return new recoil.ui.RenderedDecorator(
        recoil.ui.widgets.table.TableWidget.defaultTableDecorator_,
        goog.dom.createDom('table', {border: 1}));
};

/**
 * the default decorator for making header rows
 * @final
 * @private
 * @return {recoil.ui.RenderedDecorator}
 */

recoil.ui.widgets.table.TableWidget.defaultHeaderRowDecorator_ = function() {
    return new recoil.ui.RenderedDecorator(
        recoil.ui.widgets.table.TableWidget.defaultHeaderRowDecorator_,
        goog.dom.createDom('tr'));
};

/**
 * the default decorator for making rows
 * @final
 * @private
 * @return {recoil.ui.RenderedDecorator}
 */

recoil.ui.widgets.table.TableWidget.defaultRowDecorator_ = function() {
    return new recoil.ui.RenderedDecorator(
        recoil.ui.widgets.table.TableWidget.defaultRowDecorator_,
        goog.dom.createDom('tr'));
};

/**
 * the default decorator for making cells
 * @final
 * @private
 * @return {recoil.ui.RenderedDecorator}
 */

recoil.ui.widgets.table.TableWidget.defaultCellDecorator_ = function() {
    return new recoil.ui.RenderedDecorator(
        recoil.ui.widgets.table.TableWidget.defaultCellDecorator_,
        goog.dom.createDom('td'));

};

/**
 * the default decorator for making header cells
 * @final
 * @private
 * @return {recoil.ui.RenderedDecorator}
 */

recoil.ui.widgets.table.TableWidget.defaultHeaderDecorator_ = function() {
    return new recoil.ui.RenderedDecorator(
        recoil.ui.widgets.table.TableWidget.defaultHeaderDecorator_,
        goog.dom.createDom('th'));
};


/**
 * the default factory form for making header widgets for header cells
 * @final
 * @private
 * @return {recoil.ui.Widget}
 */

recoil.ui.widgets.table.TableWidget.defaultHeaderWidgetFactory_ =
    function(scope, cellB) {
        var widget = new recoil.ui.widgets.LabelWidget(scope);
        var name = scope.getFrp().liftB(function (cell) {
            return cell.getMeta().name;
            }, cellB);
        widget.attach(name,recoil.ui.BoolWithExplaination.TRUE);
        return widget;
    };

/**
 * utility function to compare rows in meta data
 * @private
 * @param {Object} x
 * @param {Object} y
 * @return {number}
 */
recoil.ui.widgets.table.TableWidget.rowMetaCompare_ = function(x, y) {
    var res = 0;
    for (var i = 0; i < x.key.length; i++) {
        res = x.keyCols[i].compare(x.key[i], y.key[i]);
        if (res !== 0) {
            return res;
        }
    }

    return 0;
};
/**
 * @param {Array<string>} fields array of fields to copy
 * @param {...Array<Object>} var_metas each array should be size 2 and
 *                                     like [src,dest]
 * @return {number} number of fields copied
 */
recoil.ui.widgets.table.TableWidget.copyMeta = function(fields, var_metas) {
    var copied = 0;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        for (var m = 1; m < arguments.length; m++) {
            var src = arguments[m][0];
            var dst = arguments[m][1];
            if (src[field] !== undefined) {
                dst[field] = src[field];
                copied++;
            }
        }
    }
    return copied;
};

/**
 * creates a data structure with all the information needed to layout the
 * table but does not contain the actual data, this is useful because
 * it will only fire when we need to update the table, it is the widgets inside
 * the table to update the data itself when it changes
 *
 * @private
 * @param {recoil.frp.Behaviour<recoil.structs.table.Table>} tableB
 * @return {recoil.frp.Behaviour<Object>}
 */
recoil.ui.widgets.table.TableWidget.prototype.createRenderInfo_ = function(tableB) {
    var frp = this.scope_.getFrp();
    var me = this;

    return frp.liftB(function(table) {
        var info = recoil.ui.widgets.table.TableWidget.emptyState_();


        var tableMeta = table.getMeta();
        recoil.ui.widgets.table.TableWidget.copyMeta(['tableDecorator', 'headerRowDecorator'], [tableMeta, info.tableMeta]);
        var primaryColumns = table.getPrimaryColumns();
        var rowAndColumnFields = ['cellWidgetFactory', 'cellDecorator'];
        table.forEachPlacedColumn(function(key, columnMeta) {

            var myInfo = {key: key};
            recoil.ui.widgets.table.TableWidget.copyMeta(
                goog.array.concat(
                    ['columnHeaderDecorator', 'headerWidgetFactory'],
                    rowAndColumnFields),
                [tableMeta, info.tableMeta], [columnMeta, myInfo]);
            info.columnMeta.push(myInfo);
        });


        table.forEach(function(row, rowKey, tableRowMeta) {
            var rowMeta = {};
            recoil.ui.widgets.table.TableWidget.copyMeta(
                goog.array.concat(
                    rowAndColumnFields,
                    ['rowDecorator']),
                [tableRowMeta, rowMeta], [tableMeta, info.tableMeta]);
            var rowAndCellMeta = {key: rowKey,
                                  keyCols: table.getKeyColumns(),
                                  meta: rowMeta,
                                  cellMeta: {}};
            info.rowMeta.add(rowAndCellMeta);

            table.forEachPlacedColumn(function(key, columnMeta) {
                var cell = table.getCell(rowKey, key);
                var cellMeta = {};
                var added = recoil.ui.widgets.table.TableWidget.copyMeta(
                    rowAndColumnFields, [cell.getMeta(), cellMeta]);
                if (added > 0) {
                    rowAndCellMeta.cellMeta[key.getId()] = cellMeta;
                }
            });
        });  // table.forEach
       
        console.log("InfoEqual", info, me.state_);
        console.log("result = ", recoil.util.isEqual(info, me.state_));
        
        return info;

    }, tableB);
};

/**
 * @private
 * @param {Array<Object>} newColumnInfo the relevant meta data for the colun
 * @return {Object} an object containing the pos the position to delete,
 *       and the meta information for that column
 */
recoil.ui.widgets.table.TableWidget.prototype.getColumnRemoves_ = function(newColumnInfo) {
    var delColumns = [];
    var newColMap = {};
    var curColumnInfo = this.state_.columnMeta;

    var i = 0;
    for (i = 0; i < newColumnInfo.length; i++) {
        newColMap[newColumnInfo[i].key] = newColumnInfo[i];
    }

    // backwards is important otherwize deleting the columns
    // will change the column number
    for (i = curColumnInfo.length - 1; i >= 0; i--) {
        var info = curColumnInfo[i];
        if (newColMap[info.key] === undefined) {
            delColumns.push({pos: i, meta: info});
        }
    }
    return delColumns;

};


/**
 * before calling this we must delete all columns not in new, and add all
 * all new columns have been added
 *
 * @private
 * @param {Array<Object>} newColumnInfo the column meta data of the new table
 * @return {Array<Object>}
 */
recoil.ui.widgets.table.TableWidget.prototype.getColumnMoves_ = function(newColumnInfo) {
    var delColumns = [];
    var curColMap = [];
    var curColumnInfo = this.state_.columnMeta;
    var curPositions = {};
    var result = [];

    var i = 0;
    for (i = 0; i < curColumnInfo.length; i++) {
        curColumnInfo[newColumnInfo[i].key] = newColumnInfo[i];
        curPositions[curColumnInfo[i].key] = i;
    }

    for (i = 0; i < newColumnInfo.length; i++) {
        var meta = newColumnInfo[i];
        var curPos = curPositions[meta.key];
        result.push(curPos);
    }
    return result;
};


/**
 * we should guaranteed that there are columns in cur that are not in new, since whe should delete the old cols
 * before calling this
 */
recoil.ui.widgets.table.TableWidget.prototype.getRowRemoves = function(newRows) {
    var oldRows = this.state_.rowMeta;

    var result = new goog.structs.AvlTree(recoil.ui.widgets.table.TableWidget.rowMetaCompare_);
    oldRows.inOrderTraverse(function(oldRow) {
        if (!newRows.findFirst(oldRow)) {
            result.add(oldRow);
        }
    });
    return result;
};
recoil.ui.widgets.table.TableWidget.prototype.createCell_ = 
    function (tableMeta, row, rowMeta, columnMeta)
{
    var cellMeta = rowMeta.cellMeta[columnMeta.key];
    var cellDecorator = this.getMetaValue(
        'cellDecorator', tableMeta, rowMeta.meta, columnMeta, cellMeta);
    var cellFactory = this.getMetaValue(
        'cellWidgetFactory', tableMeta, rowMeta.meta, columnMeta, cellMeta);
    var renderInfo = cellDecorator();
    renderInfo.decorator = cellDecorator;
    renderInfo.factory = cellFactory;
    row.inner.appendChild(renderInfo.outer);
    row.cols.push(renderInfo);

    console.log("factory", cellFactory);
    var widget = renderInfo.factory(
        this.scope_,
        recoil.frp.table.TableCell.create(
            this.scope_.getFrp(), this.tableB_,
            row.key, columnMeta.key));

    widget.getComponent().render(renderInfo.inner);
};

recoil.ui.widgets.table.TableWidget.prototype.addRowColumns = function(columns, tableMeta, rowsMeta) {
    var me = this;
    var renderState = this.renderState_;
    renderState.rows.inOrderTraverse(function(row) {
        var rowMeta = rowsMeta.findFirst(row);
        
        columns.forEach(function(columnMeta) {
            
            me.createCell_(tableMeta,row, rowMeta, columnMeta);
        });

    });

};
/**
 * add any headers to the table specified by columns
 * @param {Array<Object>} columns array of relevant meta data to be added
 * @param {Object} tableMeta
 */
recoil.ui.widgets.table.TableWidget.prototype.addHeaders_ = 
    function(columns, tableMeta) 
{
    var renderState = this.renderState_;
    var me = this;
    if (!renderState.headerRow) {
        return;
    }
    columns.forEach(function(meta) {
        var columnHeaderDecorator = me.getMetaValue(
            'headerDecorator', tableMeta, meta);
        
        var columnHeaderWidgetFactory = me.getMetaValue(
            'headerWidgetFactory', tableMeta, meta);
        
        var renderInfo = columnHeaderDecorator();
            renderState.headerRow.inner.appendChild(renderInfo.outer);
        renderState.headerCols.push(renderInfo);
            
        renderInfo.factory = columnHeaderWidgetFactory;
        var widget = columnHeaderWidgetFactory(
            me.scope_, 
            recoil.frp.table.TableCell.createHeader(
                me.scope_.getFrp(),
                me.tableB_, meta.key));
        renderInfo.widget = widget;
        widget.getComponent().render(renderInfo.inner);
    });
};


recoil.ui.widgets.table.TableWidget.prototype.doRemoves = function(table) {
    var renderState = this.renderState_;
    var me = this;
    var state = this.state_;
    var rowRemoves = this.getRowRemoves(table.rowMeta);
    rowRemoves.inOrderTraverse(function(key) {
        var renderRow = renderState.rows.remove({key: key});
        if (renderRow) {
            renderState.table.inner.removeChild(renderRow.outer);
        }
        state.rowMeta.remove({key: key});
    });

    // remove the header rows if any
    var colRemoves = this.getColumnRemoves_(table.columnMeta);
    colRemoves.forEach(function(col) {
        var renderInfo = renderState.headerCols[col.pos];
        renderState.headerRow.inner.removeChild(renderInfo.outer);
        renderState.headerCols.splice(col.pos, 1);
        state.columnMeta.splice(col.pos, 1);
    });


    // remove the columns from each row
    renderState.rows.inOrderTraverse(function(row) {
        colRemoves.forEach(function(col) {
            var renderInfo = row.cols[col.pos];
            row.inner.removeChild(renderInfo.outer);
            row.cols.splice(col.pos, 1);
        });
    });
};

/**
 * @param {function() : Object}  decorator
 * @param {function() : recoil.ui.Widget}  factory
 * @param {Object} oldRenderInfo
 * @param {Node} parent
 * @param {number} position
 * @return {Object}
 */
recoil.ui.widgets.table.TableWidget.prototype.replaceWidgetAndDecorator_ = function(decorator, factory, oldRenderInfo, parent, position) {
    if (decorator === oldRenderInfo.decorator && factory === oldRenderInfo.factory) {
        return oldRenderInfo;
    }
    var res = {};

    if (decorator !== oldRenderInfo.decorator) {
        res = decorator();
        parent.removeChild(oldRenderInfo.outer);
        oldRenderInfo.outer.removeChild(oldRenderInfo.widget.getComponent().getElement());

        if (factory === oldRenderInfo.factory) {
            this.moveChildren(oldRenderInfo.inner, res.inner);
            res.widget = oldRenderInfo.widget;
        }
        else {
            res.widget = factory();
            res.widget.getComponent().render(res.inner);
        }
        res.factory = factory;

    }
    else {
        res.inner = oldRenderInfo.inner;
        res.outer = oldRenderInfo.outer;
    }
    res.decorator = decorator;

    return res;
};
recoil.ui.widgets.table.TableWidget.prototype.doUpdates = function(table) {
    var renderState = this.renderState_;
    var me = this;
    var state = this.state_;
    var tableMeta = table.tableMeta;
    var meta;
    for (var i = 0; i < table.columnMeta.length; i++) {
        meta = table.columnMeta[i];

        if (renderState.headerRow) {
            var oldRenderInfo = renderState.headerCols[i];
            var decorator = me.getMetaValue('headerDecorator', tableMeta, meta);
            var factory = me.getMetaValue('headerWidgetFactory', tableMeta, meta);
            renderState.headerCols[i] = this.replaceWidgetAndDecorator_(decorator, factory, oldRenderInfo, renderState.headerRow.inner, i);
        }
    }

    // remove the columns from each row
    renderState.rows.inOrderTraverse(function(row) {
        for (var i = 0; i < table.columnMeta.length; i++) {
            var columnMeta = table.columnMeta[i];
            var newRow = table.rowMeta.findFirst(row);
            var cellMeta = newRow.cellMeta[columnMeta.key];
            var oldRenderInfo = row.cols[i];
            var decorator = me.getMetaValue('cellDecorator', tableMeta, newRow.meta, columnMeta, cellMeta);
            var factory = me.getMetaValue('cellWidgetFactory', tableMeta, newRow.meta, columnMeta, cellMeta);

            row.cols[i] = me.replaceWidgetAndDecorator_(decorator, factory, oldRenderInfo, row.inner, i);
        }
    });
};


recoil.ui.widgets.table.TableWidget.prototype.getAddedColumns = function(columnMeta) {
    var oldColumns = this.state_.columnMeta;
    var oldColMap = {};
    var res = [];

    var i = 0;
    for (i = 0; i < oldColumns.length; i++) {
        oldColMap[oldColumns[i].key] = true;
    }


    for (i = 0; i < columnMeta.length; i++) {
        if (!oldColMap[columnMeta[i].key]) {
            res.push(columnMeta[i]);
        }
    }
    return res;

};

recoil.ui.widgets.table.TableWidget.prototype.doColumnAdds = function(table) {
    var renderState = this.renderState_;
    var me = this;
    var state = this.state_;
    var tableMeta = table.tableMeta;
    var addedColumns = this.getAddedColumns(table.columnMeta);
    var headerRowDecorator = this.getMetaValue('headerRowDecorator', tableMeta);
    var headerRowDecoratorVal = headerRowDecorator();


    if (headerRowDecoratorVal && renderState.headerRow) {
        console.log('header exists -> header exists');
        if (headerRowDecorator === renderState.headerRow.decorator) {
            //nothing has changed
        }
        else {
            var newHeaderRow = headerRowDecorator();
            this.replaceChild(renderState.table.inner, renderState.headerRow.outer, newHeaderRow.outer);
            this.moveChildren(renderState.headerRow.inner, newHeaderRow.inner);
            renderState.headerRow = newHeaderRow;
        }
    } else if (headerRowDecoratorVal) {

        console.log('header not exists -> header exists');
        renderState.headerRow = headerRowDecoratorVal;
        this.addHeaders_(state.columnMeta, tableMeta);
        goog.dom.insertChildAt(renderState.table.inner,
                               renderState.headerRow.outer, 0);




        // just construct the existing headers TODO
    }
    else if (renderState.headerRow) {
        console.log('header exists -> header not exists');

        table.inner.removeChild(renderState.headerRow.outer);
        renderState.headerRow = false;
    }

    // add new columns to existing rows and headers
    this.addHeaders_(addedColumns, tableMeta);
    addedColumns.forEach(function(meta) {
        state.columnMeta.push(meta);
    });
    this.addRowColumns(addedColumns, tableMeta, table.rowMeta);
};

recoil.ui.widgets.table.TableWidget.prototype.doColumnMoves = function(table) {
    var movedColumns = this.getColumnMoves_(table.columnMeta);
    var renderState = this.renderState_;
    var me = this;
    var state = this.state_;
    var to;
    var from;
    var newColumnMeta = [];
    var newHeaderCols = [];

    for (to = 0; to < movedColumns.length; to++) {
        from = movedColumns[to];
        newColumnMeta.push(state.columnMeta[from]);
        if (renderState.headerRow) {
            var renderInfo = renderState.headerCols[from];

            if (from !== to) {
                renderState.headerRow.inner.removeChild(renderInfo.outer);
                goog.dom.insertChildAt(renderState.headerRow.inner, renderInfo.outer, to);
            }

        }
        newHeaderCols.push(renderInfo);

    }

    renderState.headerCols = newHeaderCols;

    renderState.rows.inOrderTraverse(function(row) {
        var newCols = [];
        for (to = 0; to < movedColumns.length; to++) {
            from = movedColumns[to];
            var renderInfo = row.cols[from];
            newCols.push(renderInfo);
            if (from !== to) {
                row.inner.removeChild(renderInfo.outer);
                goog.dom.insertChildAt(renderState.headerRow.inner, renderInfo.outer, to);
            }
        }
        row.renderInfo = newCols;
    });

    state.columnMeta = newColumnMeta;

};
/**
 *
 */
recoil.ui.widgets.table.TableWidget.prototype.getNewRows_ = function(rowMeta) {

    var me = this;
    var state = this.state_;
    var result = new goog.structs.AvlTree(recoil.ui.widgets.table.TableWidget.rowMetaCompare_);
    var pos = 0;

    rowMeta.inOrderTraverse(function(row) {
        if (!state.rowMeta.findFirst(row)) {
            var newRow = goog.object.clone(row);
            newRow.pos = pos;
            result.add(newRow);
        }
        pos++;
    });

    return result;

};
/**
 * todo split out the table, and the useful meta data from a table
 * this will be helpful, because we don't really need to trigger an update
 * unless the useful parts have changed
 */
recoil.ui.widgets.table.TableWidget.prototype.updateState_ = function(helper, tableB) {
    var me = this;
    var state = this.state_;
    var renderState = this.renderState_;

    if (helper.isGood()) {
        // not just build table
        var table = tableB.get();
        var tableMeta = table.tableMeta;
        var tableDecorator = this.getMetaValue('tableDecorator', tableMeta);
        var tableComponent = tableDecorator();

        if (this.renderState_.table) {
            if (this.renderState_.table.decorator !== tableDecorator) {
                this.container_.getElement().removeChild(this.renderState_.outer);
                this.moveChildren(this.renderState_.table.inner, tableComponent.inner);
                goog.dom.insertChildAt(this.container_.getElement(), tableComponent.outer, 0);
                this.renderState_.table = tableComponent;
            }

        }
        else {
            this.container_.getElement().appendChild(tableComponent.outer);
            this.renderState_.table = tableComponent;

        }
        this.renderState_.table.decorator = tableDecorator;

        this.doRemoves(table);
        this.doColumnAdds(table);
        this.doColumnMoves(table);
        // all the columns are in the right position, update the decorators and stuff so they
        // are correct
        this.doUpdates(table);

        // at this point every existing cell has the correct behaviour
        // now all we have to do is add th new rows

        var newRows = this.getNewRows_(table.rowMeta);
        newRows.inOrderTraverse(function(row) {

            console.log('Row', row);
            // do this in order of the columns defined in the meta data
            var rowDecorator = me.getMetaValue('rowDecorator', tableMeta, row.meta);
            var rowComponent = rowDecorator();
            rowComponent.cols = [];
            rowComponent.key = row.key;
            rowComponent.keyCols = row.keyCols;
            console.log("ROW", row);
            goog.dom.insertChildAt(me.renderState_.table.inner, rowComponent.outer, me.renderState_.headerRow ? row.pos + 1 : row.pos);
            
            console.log("rows",renderState.rows.getCount(), renderState.rows);

            table.columnMeta.forEach(function(columnMeta) {
                me.createCell_(tableMeta,rowComponent,row, columnMeta);
            });
            renderState.rows.add(rowComponent);
            
        });
        this.state_ = table;
    }
    else {
        // display error or not ready state
    }
};

/**
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.table.TableWidget.prototype.getComponent = function() {
    return this.container_;
};


recoil.ui.widgets.table.TableWidget.prototype.attachStruct = function(table) {

};
/**
 * @param {recoil.ui.Behaviour<recoil.structs.table.Table> | recoil.structs.table.Table} table
 * @param {recoil.ui.Behaviour<recoil.ui.widgets.TableMetaData> |recoil.ui.widgets.TableMetaData} meta
 */
recoil.ui.widgets.table.TableWidget.prototype.attach = function(table, meta) {

    var util = new recoil.frp.Util(this.scope_.getFrp());
    var frp = this.scope_.getFrp();

    table = util.toBehaviour(table);
    meta = util.toBehaviour(meta);

    var complete = frp.liftBI(function() {
        console.log('meta', meta.get());
        return meta.get().applyMeta(table.get());
    }, function(val) {
        table.set(val);
    }, table, meta);


    this.tableB_ = complete;
    this.renderInfoB_ = this.createRenderInfo_(complete);
    this.helper_.attach(this.renderInfoB_);

};
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

/**
 * @constructor
 * @template T
 * @param {recoil.structs.table.ColumnKey} key
 * @param {string} name
 * @implements {recoil.ui.widgets.table.Constructor}
 */
recoil.ui.widgets.table.DefaultColumn = function(key, name) {
    this.name_ = name;
    this.key_ = key;
};

/**
 * @param {Object} curMeta
 * @return {Object}
 * @nosideeffects
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getMeta = function(curMeta) {
    var meta = {name: this.name_};
    goog.object.extend(meta, curMeta);

    var factoryMap = meta.typeFactories;
    var factory = (factoryMap === undefined || meta.type === undefined)
            ? undefined : factoryMap[meta.type];
    var column = factory === undefined
            ? undefined : factory(this.key_, meta.name);

    if (column === undefined) {
        column = new recoil.ui.widgets.table.StringColumn(this.key_, meta.name);
    }
    return column.getMeta(meta);
};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getKey = function() {
    return this.key_;
};


/**
 * @brief data that describes the table, it contains the columns and how to contruct the render widget
 * for that column
 * @constructor
 */
recoil.ui.widgets.TableMetaData = function() {
    this.columns_ = [];
};

/**
 * @template CT
 * @param {recoil.structs.table.Column<CT>} col
 */
recoil.ui.widgets.TableMetaData.prototype.addColumn = function(col) {
    this.columns_.push(col);
};

/**
 *
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} key
 * @param {String} name
 */
recoil.ui.widgets.TableMetaData.prototype.add = function(key, name) {
    this.addColumn(new recoil.ui.widgets.table.DefaultColumn(key, name));
};
/**
 * @nosideeffects
 * @param {recoil.structs.table.Table} table
 * @return {recoil.structs.table.Table}
 */
recoil.ui.widgets.TableMetaData.prototype.applyMeta = function(table) {
    var mtable = table.unfreeze();
    var pos = 0;
    this.columns_.forEach(function(col) {
        var meta = col.getMeta(mtable.getColumnMeta(col.getKey()));
        if (meta.position === undefined) {
            meta.position = pos;
        }
        mtable.setColumnMeta(col.getKey(), meta);
        pos++;
    });
    console.log('frozen', mtable.freeze());
    return mtable.freeze();
};
