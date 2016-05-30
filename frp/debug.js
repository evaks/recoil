goog.provide('recoil.frp.Debug');

/**
 * a utility function to print out an frp node
 * @template T
 * @param {string} name
 * @param {!recoil.frp.Behaviour<T>} behaviour
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.Debug = function(name, behaviour) {
    return behaviour.frp().metaLiftBI(
        function() {
            console.log(name, 'calc', behaviour.metaGet());
            return behaviour.metaGet();
        },
        function(val) {
            console.log(name, 'inv', val);

            behaviour.metaSet(val);
        }, behaviour);
};
