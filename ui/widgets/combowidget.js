goog.provide('recoil.ui.widgets.ComboWidget');

goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.Widget');
goog.require('goog.ui.Component');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.ComponentWidgetHelper');

/**
 * @implements {recoil.ui.Widget}
 * @template T
 * @param scope
 * @constructor
 */
recoil.ui.widgets.ComboWidget = function (scope) {
    this.scope_ = scope;
    this.combo_ = new goog.ui.ComboBox();

    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.combo_, this, this.updateState_);
    this.changeHelper_ = new recoil.ui.EventHelper(scope, this.combo_, goog.ui.Component.EventType.CHANGE);
};

/**
 *
 * @returns {!goog.ui.Component}
 */
recoil.ui.widgets.ComboWidget.prototype.getComponent = function () {
    return this.combo_;
};

/**
 *
 * @param {recoil.frp.Behaviour<!string>|!string} name
 * @param {recoil.frp.Behaviour<!T>|!T} value
 * @param {recoil.frp.Behaviour<!Array<T>>|Array<T>} list
 * @param {recoil.frp.Behaviour<!recoil.ui.BoolWithExplanation>|!recoil.ui.BoolWithExplanation} opt_enabled
 * @param {recoil.frp.Behaviour<!function(T) : string>| !function(T) : string} opt_renderer
 */
recoil.ui.widgets.ComboWidget.prototype.attach = function (name, value, list, opt_enabled, opt_renderer) {
    this.attachStruct({'name': name, 'value': value, 'list': list, 'enabled': opt_enabled, 'renderer': opt_renderer});
};

/**
 * @param {!Object| !recoil.frp.Behaviour<Object>} options
 */
recoil.ui.widgets.ComboWidget.prototype.attachStruct = function (options) {
    var frp = this.helper_.getFrp();
    var util = new recoil.frp.Util(frp);

    var structs = recoil.frp.struct;
    var optionsB = structs.flattern(frp, options);

    this.nameB_ = structs.get('name', optionsB);
    this.valueB_ = structs.get('value', optionsB);
    this.listB_ = structs.get('list', optionsB);
    /**
     * @type {recoil.frp.Behaviour.<!recoil.ui.BoolWithExplanation>}
     * @private
     */
    this.enabledB_ = structs.get('enabled', optionsB, recoil.ui.BoolWithExplanation.TRUE);
    this.rendererB_ = structs.get('renderer', optionsB, recoil.ui.widgets.ComboWidget.DEFAULT_RENDERER);

    var readyB = util.isAllGoodExplain(this.valueB_, this.nameB_, this.listB_, this.enabledB_, this.rendererB_);

    this.helper_.attach(this.nameB_, this.valueB_, this.listB_, this.enabledB_, this.rendererB_);

    var me = this;
    this.changeHelper_.listen(this.scope_.getFrp().createCallback(function (v) {

        var val = v.target.getValue();
        var r = me.rendererB_.get();
        var list = me.listB_.get();
        for (var i = 0; i < list.length; i++) {
            if (recoil.util.isEqual(val, r(list[i]))) {
                me.valueB_.set(list[i]);
                break;
            }
        }
        // me.listB_.set([{a:'one'}, {a:'two'}, {a: 'three'}, {a: 'four'}]);

    }, this.valueB_, this.listB_, this.rendererB_));
};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.ComboWidget.prototype.updateState_ = function (helper) {
    if (helper.isGood()) {

        console.log('in updateState_');
        var c = this.combo_;
        c.setEnabled(this.enabledB_.get().val());
        c.removeAllItems();

        var renderer = this.rendererB_.get();

        var selected = this.valueB_.get();
        var found = false;

        for (var i = 0; i < this.listB_.get().length; i++) {
            var val = this.listB_.get()[i];
            c.addItem(renderer(val));
            if (recoil.util.isEqual(val, selected)) {
                found = true;
            }
        }
        if (!found) {
       //     c.addItem(new goog.ui.ComboBoxItem(renderer(selected), selected));

        }
     //   c.setValue(selected);

    }
};

/**
 *
 * @type function (*) : {goog.ui.ControlContent}
 */
recoil.ui.widgets.ComboWidget.DEFAULT_RENDERER = function (obj) {
    return "" + obj;
};
