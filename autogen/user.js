goog.provide('recoil.db.User');

/**
 *
 * @param {String} name
 * @param {String} userName
 * @param {String} email
 * @param {String} password
 * @constructor
 */
recoil.db.User = function(name, userName, email, password) {
    this.name_ = name;
    this.userName_ = userName;
    this.email_ = email;
    this.password_ = password;
};

/**
 *
 * @return {String}
 */
recoil.db.User.prototype.getName = function() {
    return this.name_;
};

/**
 *
 * @return {String}
 */
recoil.db.User.prototype.getUserName = function() {
    return this.userName_;
};

/**
 *
 * @return {String}
 */
recoil.db.User.prototype.getEmail = function() {
    return this.email_;
};

/**
 *
 * @return {String}
 */
recoil.db.User.prototype.getPassword = function() {
    return this.password_;
};
