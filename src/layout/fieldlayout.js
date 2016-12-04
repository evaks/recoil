goog.provide('recoil.layout.FieldLayoutWidget');

goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.structs.Pair');
goog.require('recoil.ui.widgets.InputWidget');


/**
 *
 * @param {!recoil.ui.WidgetScope} scope
 * @implements recoil.ui.Widget
 * @constructor
 */
recoil.layout.FieldLayoutWidget = function(scope) {
    this.container_ = new goog.ui.Component();
    this.scope_ = scope;
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.container_, this, this.updateState_);
};


/**
 *
 * @param {Array<recoil.structs.Pair<recoil.ui.Widget, recoil.ui.Widget>>|recoil.frp.Behaviour<Array<recoil.structs.Pair<recoil.ui.Widget, recoil.ui.Widget>>>} widgetsB
 */
recoil.layout.FieldLayoutWidget.prototype.attach = function(widgetsB) {
    var util = new recoil.frp.Util(this.helper_.getFrp());


    this.widgetsB_ = util.toBehaviour(widgetsB);

    this.helper_.attach(this.widgetsB_);

};

/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.layout.FieldLayoutWidget.prototype.updateState_ = function(helper) {
    var widgets = this.widgetsB_;

    helper.clearContainer();

    if (helper.isGood()) {

        for (var i = 0; i < widgets.get().length; i++) {
            var pair = widgets.get()[i];

            if (pair.getX() !== null) {
                this.container_.addChild(pair.getX(), true);
            }
            this.container_.addChild(pair.getY(), true);
        }
    }
};

/**
 *
 * @return {!goog.ui.Component}
 */
recoil.layout.FieldLayoutWidget.prototype.getComponent = function() {
    return this.container_;
};

/**
 * all widgets should not allow themselves to be flatterned
 *
 * @type {!Object}
 */

recoil.layout.FieldLayoutWidget.prototype.flatten = recoil.frp.struct.NO_FLATTEN;

///**
// *
// * @param {recoil.ui.Widget} widgets
// */
//recoil.layout.FieldLayoutWidget.prototype.attach = function (widget) {
//    var util = new recoil.frp.Util(this.helper_.getFrp());
//    this.widget = util.toBehaviour(widget);
//    this.helper_.attach(this.widget);
//};
//
///**
// *
// * @param {recoil.ui.WidgetHelper} helper
// * @private
// */
//recoil.layout.FieldLayoutWidget.prototype.updateState_ = function (helper) {
//
//
//    console.log(this.widgets_);
//
//    if(helper.isGood()) {
//            this.container_.addChild(this.widget.get().getComponent(), true);
//    }
//};
