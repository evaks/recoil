goog.provide('recoil.frp.debug');


recoil.frp.debug.debug =  function (name, behaviour) {
    return behaviour.frp().liftBI(
        function() {
            console.log("calc", name, behaviour.get());
            return behaviour.get();
        },
        function (val) {
            console.log("inv", name, behaviour.get());
            
            behaviour.set(val);
        }, behaviour);
};
