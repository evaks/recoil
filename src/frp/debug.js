goog.provide('recoil.frp.Debug');

/**
 * a utility function to print out an frp node
 * @template T
 * @param {string} name
 * @param {!recoil.frp.Behaviour<T>} behaviour
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Debug = function(name, behaviour) {
        return behaviour.debug(name);
};
