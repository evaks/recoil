goog.provide('recoil.debugger.StateWatcher');

goog.require('goog.dom');
goog.require('goog.ui.Zippy');
goog.require('recoil.debugger.ObjectBrowser');

/**
 * @param {Element} container
 * @constructor
 */
recoil.debugger.StateWatcher = function(container) {
    var makeBrowser = function(name) {
        var res = {
            header: goog.dom.createDom(
                'div', {class: 'recoil-watcher-header'},
                goog.dom.createDom('div', {class: 'recoil-watcher-icon'}), name),
            body: goog.dom.createDom('div', undefined)
        };

        res.browser = new recoil.debugger.ObjectBrowser(res.body);
        return res;
    };
    this.watches_ = makeBrowser('Watches');
    this.current_ = makeBrowser('Current');
    this.pendingUp_ = makeBrowser('Pending Up');
    this.pendingDown_ = makeBrowser('Pending Down');


    [this.current_, this.watches_, this.pendingUp_, this.pendingDown_]
        .forEach(function(info) {
            info.zippy = new goog.ui.Zippy(info.header, info.body);
            container.appendChild(info.header);
            container.appendChild(info.body);
        });
    this.current_.zippy.expand();
};
/**
 * @param {!Array<!recoil.frp.Behaviour>} watches
 * @param {!recoil.frp.Behaviour} curNode
 * @param {!Array<!recoil.frp.Behaviour>} pendingUp
 * @param {!Array<!recoil.frp.Behaviour>} pendingDown
 */

recoil.debugger.StateWatcher.prototype.setState = function(watches, curNode, pendingUp, pendingDown) {
    this.current_.browser.addObject('current', curNode);
};
