/**
 * provides a set of utilities that give logical operation
 *
 */
goog.provide('recoil.frp.string');

goog.require('recoil.frp.Frp');
goog.require('recoil.frp.util');
goog.require('recoil.util.func');

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} first
 * @param {...(!recoil.frp.Behaviour<string>|string)} var_rest
 * @return {!recoil.frp.Behaviour<string>}
 */

recoil.frp.string.concat = function(first, var_rest) {
    return recoil.frp.util.liftMemberFunc(String.prototype.concat, arguments);
};


/**
 *
 * @param {!recoil.frp.Behaviour<string>} strB
 * @return {!recoil.frp.Behaviour<number>}
 */

recoil.frp.string.length = function(strB) {
    return strB.frp().liftB(function(s) {
        return s.length;
    }, strB);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<number>|number} pos
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.charAt = function(str, pos) {
    return recoil.frp.util.liftMemberFunc(String.prototype.charAt, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<number>|number} pos
 * @return {!recoil.frp.Behaviour<number>}
 */
recoil.frp.string.charCodeAt = function(str, pos) {
    return recoil.frp.util.liftMemberFunc(String.prototype.charCodeAt, arguments);
};


/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<string>|string} pos
 * @return {!recoil.frp.Behaviour<boolean>}
 */
recoil.frp.string.endsWith = function(str, pos) {
    return recoil.frp.util.liftFunc(goog.string.endsWith, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<string>|string)} searchVal
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_start
 * @return {!recoil.frp.Behaviour<number>}
 */
recoil.frp.string.indexOf = function(str, searchVal, opt_start) {
    console.log(arguments);
    return recoil.frp.util.liftMemberFunc(String.prototype.indexOf, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<string>|string)} searchVal
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_start
 * @return {!recoil.frp.Behaviour<number>}
 */
recoil.frp.string.lastIndexOf = function(str, searchVal, opt_start) {
    return recoil.frp.util.liftMemberFunc(String.prototype.lastIndexOf, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<!RegExp>|!RegExp)} regexp
 * @return {!recoil.frp.Behaviour<Array<string>>}
 */
recoil.frp.string.match = function(str, regexp) {
    return recoil.frp.util.liftMemberFunc(String.prototype.match, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<number>|!RegExp)} repeats
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.repeat = function(str, repeats) {
    return recoil.frp.util.liftFunc(goog.string.repeat, arguments);
};


/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<(!RegExp|string)>|!RegExp|string|!recoil.frp.Behaviour<!RegExp>|!recoil.frp.Behaviour<string>} searchValue
 * @param {(!recoil.frp.Behaviour<string>|string)} newVal
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.replace = function(str, searchValue, newVal) {
    return recoil.frp.util.liftMemberFunc(String.prototype.replace, arguments);
};


/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<(!RegExp|string)>|!RegExp|string|!recoil.frp.Behaviour<!RegExp>|!recoil.frp.Behaviour<string>} searchValue
 * @param {(!recoil.frp.Behaviour<string>|string)} newVal
 * @return {!recoil.frp.Behaviour<number>}
 */
recoil.frp.string.search = function(str, searchValue, newVal) {
    return recoil.frp.util.liftMemberFunc(String.prototype.search, arguments);
};


/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<number>|number)} start
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_end
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.slice = function(str, start, opt_end) {
    return recoil.frp.util.liftMemberFunc(String.prototype.slice, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {!recoil.frp.Behaviour<(!RegExp|string)>|!RegExp|string|!recoil.frp.Behaviour<!RegExp>|!recoil.frp.Behaviour<string>} separator
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_limit
 * @return {!recoil.frp.Behaviour<!Array<string>>}
 */
recoil.frp.string.split = function(str, separator, opt_limit) {
    return recoil.frp.util.liftMemberFunc(String.prototype.split, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<string>|string)} prefix
 * @return {!recoil.frp.Behaviour<boolean>}
 */
recoil.frp.string.startsWith = function(str, prefix) {
    return recoil.frp.util.liftFunc(goog.string.startsWith, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<number>|number)} start
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_length
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.substr = function(str, start, opt_length) {
    return recoil.frp.util.liftMemberFunc(String.prototype.substr, arguments);
};

/**
 *
 * @param {(!recoil.frp.Behaviour<string>|string)} str
 * @param {(!recoil.frp.Behaviour<number>|number)} start
 * @param {(!recoil.frp.Behaviour<number>|number)=} opt_end
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.substring = function(str, start, opt_end) {
    return recoil.frp.util.liftMemberFunc(String.prototype.substring, arguments);
};

/**
 *
 * @param {recoil.frp.Behaviour<string>} str
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.toUpperCase = function(str) {
    return recoil.frp.util.liftMemberFunc(String.prototype.toUpperCase, arguments);
};

/**
 *
 * @param {recoil.frp.Behaviour<string>} str
 * @return {!recoil.frp.Behaviour<string>}
 */
recoil.frp.string.toLowerCase = function(str) {
    return recoil.frp.util.liftMemberFunc(String.prototype.toLowerCase, arguments);
};
