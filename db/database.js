goog.provide('recoil.db.Database');

goog.require('goog.net.XhrIo');
goog.require('goog.Uri');
goog.require('recoil.errors.HttpError');
/**
 *
 * @constructor
 * @param {recoil.frp.Frp} frp
 */
recoil.db.Database = function (frp) {
    this.frp_ = frp;
};

/**
 *
 * @param table
 * @returns {recoil.frp.Behaviour.<T>}
 */
recoil.db.Database.prototype.getList = function (table) {

    var loc = window.location;
    var url = goog.Uri.create(loc.protocol, null, loc.hostname, goog.string.parseInt(loc.port), loc.pathname + 'db/' + encodeURIComponent(table) + '/getlist', null, null, true);

    var me = this;
    var b = this.frp_.createMetaB(recoil.frp.BStatus.notReady());
    goog.net.XhrIo.send(url, function (e) {

        me.frp_.accessTrans(function() {
            var xhr = e.target;
            var errorCode = xhr.getLastErrorCode();
            if(errorCode !== goog.net.ErrorCode.NO_ERROR) {
                console.log(xhr.getLastError());
                b.metaSet(recoil.frp.BStatus.errors([new recoil.errors.HttpError(errorCode)]));
            } else {
                try {
                    b.set(xhr.getResponseJson());
                }
                catch (e) {
                    b.metaSet(recoil.frp.BStatus.errors([e]));
                }
            }
        }, b);
    });

    return b;
};