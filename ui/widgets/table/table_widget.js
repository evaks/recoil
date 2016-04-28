goog.provide('recoil.ui.widgets.table.TableWidget');
goog.provide('recoil.ui.widgets.table.TableMetaData');
goog.provide('recoil.ui.widgets.table.Column');


goog.require('goog.ui.Container');
goog.require('goog.string');
goog.require('recoil.ui.AttachableWidget');
goog.require('recoil.structs.table.Table');
goog.require('recoil.structs.table.TableRow');
goog.require('recoil.ui.ComponentWidgetHelper');
goog.require('recoil.frp.Util');
goog.require('recoil.ui.widgets.table.StringColumn');

/**
 * @constructor
 * @implements recoil.ui.AttachableWidget
 */
recoil.ui.widgets.table.TableWidget = function(scope) {
    this.scope_ = scope;
    this.container_ = new goog.ui.Container();
    this.container_.createDom();
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);

    
};

/**
 * this gets the most relevant value for this field int the meta, it goes backwards 
 * through the meta information until it finds the key that it is looking for
 * if it does not find it there it then will check the scope for that value with the name
 * recoil.ui.widgets.table.TableWidget.'value' if it is not there it will then return
 * recoil.ui.widgets.table.TableWidget.default'Value'_ (note the first letter is capitalised)
 
 * @param {string} value the key of value to get
 * @param {...Object} var_meta all the meta information
 */
recoil.ui.widgets.table.TableWidget.prototype.getMetaValue = function (value, var_meta) {
    var val;

    for (var i = arguments.length -1; i>0; i--) {
	val = arguments[i][value];
	if (val !== undefined) {
	    return val;
	}
    }
    val = recoil.util.object.getByParts(this.scope_, 'recoil', 'ui', 'widgets', 'table', 'TableWidget', value);

    if (val !== undefined) {
	return val;
    }

    return recoil.ui.widgets.table.TableWidget['default' + goog.string.toTitleCase(value) + '_'];
};
recoil.ui.widgets.table.TableWidget.defaultTableDecorator_ = function () {
    var val = goog.dom.createDom('table', {border:1});
    return {inner : val, outer : val};
};

recoil.ui.widgets.table.TableWidget.defaultHeaderRowDecorator_ = function () {
    var val = goog.dom.createDom('tr');
    return {inner : val, outer : val};
};

recoil.ui.widgets.table.TableWidget.defaultRowDecorator_ = function () {
    var val = goog.dom.createDom('tr');
    return {inner : val, outer : val};
};

recoil.ui.widgets.table.TableWidget.defaultCellDecorator_ = function () {
    var val = goog.dom.createDom('td');
    return {inner : val, outer : val};
};


recoil.ui.widgets.table.TableWidget.defaultHeaderDecorator_ = function () {
    var val = goog.dom.createDom('th');
    return {inner : val, outer : val};
};

recoil.ui.widgets.table.TableWidget.rowMetaCompare_ = function (x, y) {
};
recoil.ui.widgets.table.TableWidget.prototype.createRenderInfo_ = function (frp, tableB) {
    var frp = this.scope_.getFrp();

    return frp.liftB(function (table) {
	var info = {
	    rowMeta : new goog.structs.AvlTree(recoil.ui.widgets.table.TableWidget.rowMetaCompare_),
	    columnMeta : [],
	    tableMeta : {}};

        var tableMeta = table.getMeta();
	var me = this;
	this.copyMeta(['tableDecorator','headerRowDecorator'], [tableMeta, info.tableMeta]);

	var rowAndColumnFields = ['cellWidgetFactory', 'cellDecorator'];
	table.forEachPlacedColumn(function (columnMeta) {

	    var myInfo = {};
	    me.copyMeta(goog.array.concat(['columnHeaderDecorator', 'headerWidgetFactory'], rowAndColumnFields),
			[tableMeta, info.tableMeta], [columnMeta, myInfo]);
	    info.columnMeta.push(myInfo);
	};
				  

        table.forEach(function (row, rowKey, tableRowMeta) {
	    var rowMeta = {};
	    me.copyMeta(goog.array.concat(['rowDecorator'], [tableRowMeta, rowMeta], [tableMeta, info.tableMeta]);
	    info.rowMeta.add({key: rowKey, meta : rowMeta});
	    
            table.forEachPlacedColumn(function (columnMeta) {
		var key = columnMeta.key;
		var cellMeta = {};
		var added = 0;

		
		

                var cellFactory = me.getMetaValue(, tableMeta, rowMeta, columnMeta);
                var cellComponent = cellDecorator();
                rowComponent.inner.appendChild(cellComponent.outer);
		i++;
//                cellFactory.create(cellComponent.inner, recoil.frp.structs.table.CellValue.create(me.frp_, table, rowKey, columnMeta.key));
            });
        });
				  
        var  = me.getMetaValue('headerDecorator', tableMeta, columnMeta);
        var rowDecorator = me.getMetaValue('rowDecorator', tableMeta, rowMeta);
	
    }, tableB);
};
/**
 * todo split out the table, and the useful meta data from a table
 * this will be helpful, because we don't really need to trigger an update
 * unless the useful parts have changed
 */
recoil.ui.widgets.table.TableWidget.prototype.updateState_ = function (helper, tableB) {
    var me = this;
    if (helper.isGood()) {
        // TODO this is just me thinking at the moment this needs to do a difference
        // not just build table 
        var table = tableB.get();
	console.log(table);
        var tableMeta = table.getMeta();
        var tableDecorator = this.getMetaValue('tableDecorator', tableMeta);

        
        var tableComponent = tableDecorator();
	
	this.container_.getElement().appendChild(tableComponent.outer);
	
        var headerRowDecorator = this.getMetaValue('headerRowDecorator', tableMeta)();

       
        if (headerRowDecorator) {
            //this allows the no header on a table the header row decorator returns false
	    
            // build the column header

            table.forEachPlacedColumn(function (columnMeta) {
                var columnHeaderDecorator = me.getMetaValue('headerDecorator', tableMeta, columnMeta);
                var headerContainer = columnHeaderDecorator();

                tableComponent.inner.appendChild(headerContainer.outer);
                // create a widget of the header
                
            });
        }

        table.forEach(function (row, rowKey, rowMeta) {
            // do this in order of the columns defined in the meta data
            var rowDecorator = me.getMetaValue('rowDecorator', tableMeta, rowMeta);
            var rowComponent = rowDecorator();

            tableComponent.inner.appendChild(rowComponent.outer);

            table.forEachPlacedColumn(function (columnMeta) {
                var cellDecorator = me.getMetaValue('cellDecorator', tableMeta, rowMeta, columnMeta);
                var cellFactory = me.getMetaValue('cellWidgetFactory', tableMeta, rowMeta, columnMeta);
                var cellComponent = cellDecorator();
                rowComponent.inner.appendChild(cellComponent.outer);
//                cellFactory.create(cellComponent.inner, recoil.frp.structs.table.CellValue.create(me.frp_, table, rowKey, columnMeta.key));
            });
        });
    }
    else {
        // display error or not ready state
        }
};

/**
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.table.TableWidget.prototype.getComponent = function () {
    return this.container_;
};


recoil.ui.widgets.table.TableWidget.prototype.attachStruct = function (table) {
    var util = new recoil.frp.Util(this.scope_.getFrp());
    this.table_ = util.toBehaviour(table);

    this.helper_.attach(this.table_);
    
};
/**
 * @param {recoil.ui.Behaviour<recoil.structs.table.Table> | recoil.structs.table.Table} table
 * @param {recoil.ui.Behaviour<recoil.ui.widgets.TableMetaData> |recoil.ui.widgets.TableMetaData} meta
 */
recoil.ui.widgets.table.TableWidget.prototype.attach = function (table, meta) {
    
    var util = new recoil.frp.Util(this.scope_.getFrp());
    var frp = this.scope_.getFrp();
    
    table = util.toBehaviour(table);
    meta = util.toBehaviour(meta);
    
    var complete = frp.liftBI(function() {console.log("meta",meta.get());return meta.get().applyMeta(table.get());}, function(val) {table.set(val);}, table, meta);

    this.attachStruct(complete);

};
/**
 * @interface
 * @template T
 */
recoil.ui.widgets.table.Column = function () {
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
recoil.ui.widgets.table.Column.prototype.getMeta = function (curMeta) {
    
};

/**
 * @return {recoil.structs.table.ColumnKey}
 */
recoil.ui.widgets.table.Column.prototype.getKey = function () {
    
};

/**
 * @constructor
 * @template T
 * @param {recoil.structs.table.ColumnKey} key
 * @param {string} name
 * @implements {recoil.ui.widgets.table.Constructor}
 */
recoil.ui.widgets.table.DefaultColumn = function (key, name) {
    this.name_ = name;
    this.key_ = key;
};

/**
 * @param {Object} curMeta
 * @return {Object}
 * @nosideeffects
 */
recoil.ui.widgets.table.DefaultColumn.prototype.getMeta = function (curMeta) {
    var meta = {name : this.name_};
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
recoil.ui.widgets.table.DefaultColumn.prototype.getKey = function () {
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
recoil.ui.widgets.TableMetaData.prototype.addColumn = function (col) {
    this.columns_.push(col);
};

/**
 *
 * @template CT
 * @param {recoil.structs.table.ColumnKey<CT>} key
 * @param {String} name
 */
recoil.ui.widgets.TableMetaData.prototype.add = function (key, name) {
    this.addColumn(new recoil.ui.widgets.table.DefaultColumn(key, name));
};
/**
 * @nosideeffects
 * @param {recoil.structs.table.Table} table
 * @return {recoil.structs.table.Table}
 */
recoil.ui.widgets.TableMetaData.prototype.applyMeta = function (table) {
    var mtable = table.unfreeze();
    var pos = 0;
    this.columns_.forEach(function (col) {
	var meta = col.getMeta(mtable.getColumnMeta(col.getKey()));
	if (meta.position === undefined) {
	    meta.position = pos;
	}
        mtable.setColumnMeta(col.getKey(),meta);
	pos++;
    });
    console.log("frozen",mtable.freeze());
    return mtable.freeze();
};
