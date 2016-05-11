goog.provide('recoil.frp.debug');


recoil.frp.debug.debug =  function (name, behaviour) {
    return behaviour.frp().liftBI(
        function() {
            console.log(name, "calc", behaviour.get());
            return behaviour.get();
        },
        function (val) {
            console.log(name, "inv", val);
            
            behaviour.set(val);
        }, behaviour);
};
