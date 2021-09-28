goog.provide('recoil.ui.events');



goog.require('goog.events');
goog.require('recoil.frp.Behaviour');
goog.require('recoil.util.Handle');

/**
 * @param {EventTarget|goog.events.Listenable} src The node to listen to events on.
 * @param {string|Array<string>|
 *     !goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {recoil.frp.Behaviour} callback the behaviour to set with the event
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {*=} opt_data Extra data to send to the callback, this is passed
 *                      the callback will be in the format {event:x, data: opt_data}
 *                      otherwize the event will just be passed
 * @template EVENTOBJ
 **/
recoil.ui.events.listen = function(src, type, callback, opt_capt, opt_data) {
  goog.events.listen(src, type,
        function(e) {
            callback.frp().accessTrans(function() {
                if (opt_data === undefined) {
                    callback.set(e);
                }
                else {
                    callback.set({event: e, data: opt_data});
                }
            }, callback);
        }, opt_capt);
};

/**
 * turn a cb into a long callback that will change the cursor into a spinning
 * cursor
 * @param {function(?)} cb
 * @return {function(?)}
 */
recoil.ui.events.makeLong = function(cb) {
    return function(e) {

        var doit = function() {
            try {
                cb(e);
            }
            finally {
                recoil.ui.events.longListen.busy_--;
                if (recoil.ui.events.longListen.busy_ === 0) {
                    goog.dom.removeNode(recoil.ui.events.longListen.style_);
                }
            }

        };
        recoil.ui.events.longListen.busy_++;
        if (recoil.ui.events.longListen.busy_ === 1) {
            goog.dom.append(/** @type {?} */(document.head), recoil.ui.events.longListen.style_);
            // this is odd but calculating the cursor seems to make the cursor update
            // most of the time before the timeout happens, so the user can spinning cursor
            // the if (.. || true) is there because simply getting a variable is funny code
            if (window.getComputedStyle(document.body).cursor || true) {
                setTimeout(doit, 20);

            }
        }
        else {
            doit();
        }
    };
};
/**
 * like listen but this is for potentially long events, will add a class body to change the cursor
 *
 * @param {EventTarget|goog.events.Listenable} src The node to listen to events on.
 * @param {string|Array<string>|
 *     !goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {recoil.frp.Behaviour} callback the behaviour to set with the event
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {*=} opt_data Extra data to send to the callback, this is passed
 *                      the callback will be in the format {event:x, data: opt_data}
 *                      otherwize the event will just be passed
 * @template EVENTOBJ
 **/
recoil.ui.events.longListen = function(src, type, callback, opt_capt, opt_data) {
    goog.events.listen(
        src, type, recoil.ui.events.makeLong(function(e) {
            callback.frp().accessTrans(function() {
                if (opt_data === undefined) {
                    callback.set(e);
                }
                else {
                    callback.set({event: e, data: opt_data});
                }
            }, callback);

        }));
};
/**
 * @private
 */
recoil.ui.events.longListen.busy_ = 0;

/**
 * dom element to add to header get busy cursor
 * @private
 */
recoil.ui.events.longListen.style_ = goog.dom.createDom('style', {}, '* {cursor:  wait !important}');


/**
 * @param {EventTarget|goog.events.Listenable} src The node to listen to events on.
 * @param {string|Array<string>|
 *     !goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {recoil.util.Handle<recoil.frp.Behaviour>} callback the behaviour to set with the event
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @template EVENTOBJ
 **/
recoil.ui.events.listenH = function(src, type, callback, opt_capt) {
      goog.events.listen(src, type,
            function(e) {
                  if (callback.get()) {
                        callback.get().frp().accessTrans(function() {
                              callback.get().set(e);
                        }, callback.get());
                  }
            }, opt_capt);
};
