goog.provide('recoil.exception.InvalidState');
goog.provide('recoil.exception.LoopDetected');
goog.provide('recoil.exception.NoAccessors');
goog.provide('recoil.exception.NotAttached');
goog.provide('recoil.exception.NotInDom');
goog.provide('recoil.exception.NotInTransaction');


/**
 * @constructor
 * @param {Node} node
 * @this {recoil.exception.NotInDom}
 */
recoil.exception.NotInDom = function(node) {
    this._node = node;
};

/**
 * @constructor
 * @this {recoil.exception.LoopDetected}
 */
recoil.exception.LoopDetected = function() {
    var e = new Error();
    this.message = 'Loop Detected';
    this.stack = e.stack;
    this.fileName = e.fileName;
    this.lineNumber = e.lineNumber;
    this.stack = e.stack;

};


/**
 * @constructor
 * @this {recoil.exception.NotAttached}
 */
recoil.exception.NotAttached = function() {
    var e = new Error();
    this.message = 'Not Attached';
    this.stack = e.stack;
    this.fileName = e.fileName;
    this.lineNumber = e.lineNumber;
    this.stack = e.stack;


};

/**
 * @constructor
 * @extends {Error}
 * @this {recoil.exception.NoAccessors}
 */
recoil.exception.NoAccessors = function() {
//    this.constructor.prototype.__proto__ = Error.prototype
/*//    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = 'No Accessors';
    console.log("error", Error);*/
    var e = new Error();
    this.message = 'No Accessors';
    this.stack = e.stack;
    this.fileName = e.fileName;
    this.lineNumber = e.lineNumber;
    this.stack = e.stack;
};


//recoil.exception.NoAccessors.prototype = Error.prototype;

//goog.inherits(Error,recoil.exception.NoAccessors);


/**
 * @constructor
 * @this {recoil.exception.NotInTransaction}
 */
recoil.exception.NotInTransaction = function() {
  this.name_ = 'Not In Transaction';
};

/**
 * @return {string}
 */
recoil.exception.NotInTransaction.prototype.toString = function() {
    return this.name_;
};

/**
 * @constructor
 * @this {recoil.exception.InvalidState}
 */
recoil.exception.InvalidState = function() {

};

/**
 * @return {string}
 */

recoil.exception.InvalidState.prototype.toString = function() {
    return 'Invalid State';
};
