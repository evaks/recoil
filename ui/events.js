goog.provide('recoil.ui.events');



goog.require('goog.events');

/**
 * @param {EventTarget|goog.events.Listenable} src The node to listen to events on.
 * @param {string|Array<string>|
 *     !goog.events.EventId<EVENTOBJ>|!Array<!goog.events.EventId<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {recoil.frp.Behaviour} callback the behaviour to set with the event
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 **/   
recoil.ui.events.listen = function (src, type, callback, opt_capt) {
  goog.events.listen(src, type,
        function(e) {
                callback.set(e);
        }, opt_capt);      
};