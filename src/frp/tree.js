goog.provide('recoil.frp.tree');

goog.require('recoil.structs.Tree');

/**
 * @template T
 * @param {!recoil.frp.Behaviour<!recoil.structs.Tree<T>>} treeB
 * @param {!Array<string>|!recoil.frp.Behaviour<!Array<string>>} path
 * @return {!recoil.frp.Behaviour<T>}
 */
recoil.frp.tree.getValueB = function(treeB, path) {
    var util = new recoil.frp.Util(treeB.frp());
    var pathB = util.toBehaviour(path);
    return treeB.frp().liftBI(
        function(tree, path) {
            return treeB.get().getValue(path);
        },
        function(val) {
            treeB.set(treeB.get().setValue(pathB.get(), val));
        }, treeB, pathB);


};
