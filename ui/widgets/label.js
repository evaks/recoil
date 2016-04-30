/**
 * a simple widget to provide just text no formatting
 *
 */
goog.provide('recoil.ui.widgets.LabelWidget');

goog.require('goog.ui.LabelInput');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.frp.Util');
goog.require('recoil.frp.struct');
goog.require('recoil.ui.WidgetHelper');
goog.require('recoil.ui.WidgetScope');
goog.require('recoil.ui.events');


/**
 * @constructor
 * @param {recoil.ui.WidgetScope} scope
 */
recoil.ui.widgets.LabelWidget = function(scope) {
    /**
     *
     * @type {recoil.ui.WidgetScope}
     * @private
     */
    this.scope_ = scope;

    /**
     *
     * @type {goog.ui.Control}
     * @private
     */
    this.label_ = new goog.ui.Control();

    /**
     *
     * @type {goog.ui.Container}
     * @private
     */
    this.container_ = new goog.ui.Container();

    /**
     *
     * @type {recoil.ui.ComponentWidgetHelper}
     * @private
     */
    this.helper_ = new recoil.ui.ComponentWidgetHelper(scope, this.label_, this, this.updateState_);
};

/**
 * @param {recoil.frp.Behaviour<T>} name
 * @param {recoil.frp.Behaviour<T>} value
 * @param {recoil.frp.Behaviour<BoolWithExplaination>} enabled
 */
recoil.ui.widgets.LabelWidget.prototype.attach = function(name, value, enabled) {
    var util = new recoil.frp.Util(this.helper_.getFrp());

    this.nameB_ = util.toBehaviour(name);
    this.enabledB_ = util.toBehaviour(enabled);


    //this.label_.setContent(this.nameB_.get());
    //util.toBehaviour(this.label_),
    this.helper_.attach(this.nameB_, this.enabledB_);

      //var readyB = util.isAllGood(this.nameB, this.enabledB);
};

/**
 * {Object} value
 */
recoil.ui.widgets.LabelWidget.prototype.attachStruct = function(value) {
      var nameB = recoil.structs.get('name', value);
      var enabledB = recoil.structs.get('enabled', value);

      this.attach(nameB, enabledB);
};

/**
 * @private
 * @param {recoil.ui.WidgetHelper} helper
 * @param {recoil.frp.Behaviour} configB
 */
recoil.ui.widgets.LabelWidget.prototype.updateConfig_ = function(helper, configB) {
    var me = this;

    if (helper.isGood()) {
        if (me.button_ !== null) {
            goog.dom.removeChildren(this.component_);
        }
        var config = configB.get();
        this.label_ = new goog.ui.Button(config.content, config.renderer, config.domHelper);
        this.label_.render(me.component_);
        recoil.ui.events.listen(this.button_, goog.ui.Component.EventType.ACTION, this.callback_);

        // and created a new one
        me.state_.forceUpdate();
    }
};


/**
 * gets the component of the widget that should be placed in the
 * dom
 * @return {goog.ui.Component}
 */
recoil.ui.widgets.LabelWidget.prototype.getComponent = function() {
      return this.label_;
};


/**
 *
 * @param {recoil.ui.WidgetHelper} helper
 * @private
 */
recoil.ui.widgets.LabelWidget.prototype.updateState_ = function(helper) {

    if (helper.isGood()) {
        var arr = this.nameB_.get();
        this.label_.setContent(arr);

    }
    else {
        this.label_.setContent('??');
    }
};

/**
 *
 * @param {recoil.ui.WidgetScope} scope
 * @constructor
 */
recoil.ui.widgets.LabelWidgetHelper = function(scope) {
    this.scope_ = scope;

};

/**
 *
 * @param {String} name
 * @param {String} value
 * @param {Boolean} enabled
 * @return {recoil.ui.widgets.LabelWidget}
 */
recoil.ui.widgets.LabelWidgetHelper.prototype.createAndAttach = function(name, value, enabled) {
    var label = new recoil.ui.widgets.LabelWidget(this.scope_);
    label.attach(name, value, enabled);
    return label;
};
