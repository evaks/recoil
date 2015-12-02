goog.provide('recoil.errors.HttpError');
goog.require('goog.net.ErrorCode');

goog.require('recoil.errors.Error');

/**.
 *
 * @param {goog.net.ErrorCode} errorCode
 * @extends {Error}
 * @constructor
 */
recoil.errors.HttpError = function (errorCode){
    this.errorCode_ = errorCode;
    this.message = goog.net.ErrorCode.getDebugMessage(this.errorCode_);
    this.name = "HttpError";
};

goog.inherits(recoil.errors.HttpError, Error);

