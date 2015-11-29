var isArray = require("x-is-array")

module.exports = function(vNode, domNode, onPatch) {
  var hooks = []
    , toArray = function(val) { return isArray(val) ? val : [val] }

  var getHooks = function(patches, tree) {
    if (!tree) return

    var domNode

    (patches.children || []).forEach(function(patch, idx) {
      domNode = tree.children[idx]

      var p = onPatch && onPatch(patch, domNode, getHooks)
      if (p) hooks.push(p)
    })
  }

  getHooks({ children: toArray(vNode) }
          ,{ children: toArray(domNode) })

  return hooks
}
