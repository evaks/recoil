goog.provide('recoil.ui.widgets.SelectorWidget');
goog.require('goog.ui.Container');
goog.require('goog.ui.Control');
goog.require('recoil.util');
goog.require('recoil.frp.Behaviour');

/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.SelectorWidget = function (scope) {
    this.scope_ = scope;
    this.component_ = new goog.ui.Component();
    this.selector_ = new goog.ui.Select();

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.selector_, this, this.updateState_);
    // this.changeHelper_ = new recoil.ui.EventHelper(scope, this.selector_, goog.ui.Component.EventType.ACTION);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.selector_, goog.ui.Component.EventType.CHANGE);

};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.ui.widgets.SelectorWidget.prototype.getComponent = function () {
    return this.selector_;
};

/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} nameB
 * @param {recoil.frp.Behaviour<!T>|!T} valueB
 * @param {recoil.frp.Behaviour<!Array<T>>|Array<T>} listB
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplaination>|!recoil.ui.BoolWithExplaination} opt_enabledB
 * @param {recoil.frp.Behaviour<!function(T) : string>| !function(T) : string} opt_rendererB
 */
recoil.ui.widgets.SelectorWidget.prototype.attach = function (nameB, valueB, listB, opt_enabledB, opt_rendererB) {
    this.attachStruct({name: nameB, value: valueB, list: listB, enabled: opt_enabledB, renderer: opt_rendererB});
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.SelectorWidget.prototype.attachStruct = function(options){
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);
    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);

    this.nameB_ = structs.get('name', optionsB);
    this.valueB_ = structs.get('value', optionsB);
    this.listB_ = structs.get('list', optionsB);

    /**
     * @type {recoil.frp.Behaviour.<!recoil.ui.BoolWithExplaination>}
     * @private
     */
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplaination.TRUE);
    this.rendererB_ = structs.get('renderer', optionsB, recoil.ui.widgets.SelectorWidget.DEFAULT);

    this.helper_.attach(this.nameB_, this.valueB_, this.listB_, this.enabledB_, this.rendererB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function (v) {

        var idx = v.target.getSelectedIndex();
        var list = me.listB_.get();
        if (idx < list.length) {
            me.valueB_.set(list[idx]);
        }

    }, this.valueB_, this.listB_));

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.SelectorWidget.prototype.updateState_ = function (helper) {

    if (helper.isGood()) {
        console.log('in selectWidget updateState');

        var list = this.listB_.get();
        var sel = this.selector_;
        sel.setEnabled(this.enabledB_.get().val());

        var renderer = this.rendererB_.get();

        for(var i = sel.getItemCount() - 1; i >= 0; i--){
            sel.removeItemAt(i);
        }

        var found = -1;
        for(i  = 0; i < list.length; i++){
            var val = list[i];
            sel.addItem(renderer(val));

            if (recoil.util.isEqual(this.valueB_.get(), val)) {
                found = i;
            }
        }

        if (found === -1) {
            sel.addItem(renderer(this.valueB_.get()));
            found = list.length;
        }

        sel.setSelectedIndex(found);
    }

};

/**
 * 
 * @param obj
 * @returns {!goog.ui.MenuItem}
 * @constructor
 */
recoil.ui.widgets.SelectorWidget.DEFAULT_RENDERER = function(obj, errored, enabled) {
    return new goog.ui.MenuItem(obj);
};