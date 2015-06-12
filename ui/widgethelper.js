/**
 * a utility clas that is used to update widgets based on a behaviour
 * each time the the behaviour changes the callback will be fired
 * 
 * you may access the behaviour attached to the helper inside the callback
 *    
 **/   
console.log("loading widget helper");

goog.provide('recoil.ui.WidgetHelper');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.VisibleObserver');

/**
 * @template T
 * @param {recoil.frp.Frp} frp the frp engine
 * @param {Node} container when this is no longer visible updates will longer
 *               fire and memory will be cleaned up
 * @param {Object} obj the this pointer callback will be called with
 * @param {function(recoil.ui.WidgetHelper)} callback 
 * @constructor  
 **/
   
recoil.ui.WidgetHelper = function (frp, observer, container, obj, callback) {
    this.observer_ = observer;
    this.frp_ = frp;
    this.container_ = container;
    var me = this;
    /** @private @final */
    this.callback_ = function () {callback.call(obj, me);}
    /** 
     * @type {recoil.frp.Behaviour<T>} 
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
 * @return T the value of the attached Behaviour
 */
recoil.ui.WidgetHelper.prototype.value = function () {
    return this.behaviour_.get();
};

/**
 * @return {Boolean} is the value good
 */
recoil.ui.WidgetHelper.prototype.isGood = function () {
    return this.behaviour_.metaGet();
};

/**
 * force the change to fire
 */
recoil.ui.WidgetHelper.prototype.forceUpdate = function() {
    this.behaviour_.frp().access(this.callback_, this.behaviour_);
};

/**
 * @param {!recoil.frp.Behaviour<T>} behaviour
 *
 * note the node we are watch must be in the dom by now, the reason for this is if it isn't and is
 * never added we will have a leak observer maintains a list that can never be cleared
 * also once it item is removed form the DOM and node re-added within the same execution thread
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
    this.behaviourAttached_ = this.frp_.liftB(this.callback_, this.behaviour_);    

    if (hadBehaviour) {
        if (this.isAttached_) {
          this.frp_.attach(this.behaviour_);
        }
    }
    else {    
      this.isAttached_ = false;
      this.observer_.listen(this.container_, function(visible) {
          if (visible != me.isAttached_) {
              me.isAttached_ = visible;
              if (visible) {
                  this.frp_.attach(this.behaviour_);
              }
              else {
                this.frp_.detach(this.behaviour_);
              }
          }
      });
    }
};

