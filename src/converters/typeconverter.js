goog.provide('recoil.converters.TypeConverter');

goog.require('recoil.ui.message.Message');

/**
 * @template FROM,TO
 * @interface
 */
recoil.converters.TypeConverter = function() {};

/**
 *
 * @param {FROM} val
 * @return {TO}
 */
recoil.converters.TypeConverter.prototype.convert = function(val) {};

/**
 * @param {TO} val
 * @return {{error : recoil.ui.message.Message, value : FROM, settable:(boolean|undefined), supported:(boolean|undefined)}}
 */
recoil.converters.TypeConverter.prototype.unconvert = function(val) {};
