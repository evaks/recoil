goog.provide('recoil.ui.events');



goog.require('goog.events');
goog.require('recoil.frp.Behaviour');

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
                    callback.set({event : e, data : opt_data});
                }
            }, callback);
        }, opt_capt);
};

/**
 * @param {EventTarget|goog.events.Listenable} src The node to listen to events on.
 * @param {string|Array<string>|
 *     !goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {Handle<recoil.frp.Behaviour>} callback the behaviour to set with the event
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
