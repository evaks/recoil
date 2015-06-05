/**
 * a utility clas that is used to update widgets based on a behaviour
 * each time the the behaviour changes the callback will be fired
 * 
 * you may access the behaviour attached to the helper inside the callback
 *    
 **/   
console.log("loading widget helper");

goog.provide('recoil.ui.WidgetHelper');

goog.require('recoil.frp.VisibleObserver');

/**
 * @template T
 * @param {Node} container when this is no longer visible updates will longer
 *               fire and memory will be cleaned up
 * @param {Object} me the this pointer callback will be called with
 * @param {function(recoil.ui.WidgetHelper)} callback 
 * @constructor  
 **/
   
recoil.ui.WidgetHelper = function (container, me, callback) {
    this.observer_ = recoil.frp.VisibleObserver.instance();
    this.frp_ = recoil.frp.Frp.instance();
    this._me = me;
    /** @private @final */
    this.callback_ = function () {callback.call(me);}
    /** 
     * @type {recoil.ui.Behaviour<T>} 
     * @private
     */
    this.behaviour_ = null; 
    this.behaviourAttached_ = null;
    /** 
     * @private
     * @type {boolean}     
     */    
    this._isAttached = false; 
};

/**
 * @param {!recoil.ui.Behaviour<T>} behaviour
 *
 * note the node we are watch must be in the dom by now, the reason for this is if it isn't and is
 * never added we will have a leak observer maintains a list that can never be cleared
 * also once it item is removed form the dom and node readded within the same execution thread
 * it will be considered disposed.
 * 
 * this is because there are no weak references in javascript        
 **/
   
recoil.ui.WidgetHelper.prototype.attach = function (behaviour) {
    if (this.behaviour_ === behaviour) {
      return;
    }
    var hadBehaviour = this.behaviour_ !== null;
    if (hadBehaviour) {
        if (this._isAttached) {
          this.frp_.detach(this.behaviourAttached_);
        }
    }
    
    var me = this;
    this.behaviour_ = behaviour;
    this.behaviourAttached_ = this.frp_.liftB(this.callback, this._behaviour);    

    if (hadBehaviour) {
        if (this.isAttached_) {
          this.frp_.attach(this.behaviourAttached);
        }
    }
    else {    
      var me = this;
      this.isAttached_ = false;
      this._observer.listen(element, function(visible) {
          if (visible != me.isAttached_) {
              me.isAttached_ = visible;
              if (visible) {
                  this.frp_.attach(this.behaviourAttached);
              }
              else {
                this.frp_.detach(this.behaviourAttached);
              }
          }
          visible = v;
          if (skip === 0) {
              asyncTestCase.continueTesting();
          } else {
              skip--;
          }
      });
    }
};

