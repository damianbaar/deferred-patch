
var applyProperties = require("virtual-dom/vdom/apply-properties")
var isArray = require("x-is-array")

var run = function(vNode, domNode, method, props) {
  var toUpdate = []
    , toArray = function(val) { return isArray(val) ? val : [val] }

  var getHooks = function(node, tree) {
    if (!tree) return

    var domNode

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]
      if(domNode && domNode[method])
        toUpdate.push(domNode[method](domNode, props || child.properties))
    })
  }

  getHooks({ children: toArray(vNode) }
          ,{ children: toArray(domNode) })

  return toUpdate
}

var onUpdate = function(node, domNode, props, deep) { 
  return run(node, domNode, 'onUpdate', props) 
}

module.exports = function(domNode, vpatch) {
  var vNode = vpatch.vNode
  var patch = vpatch.patch

  var removeInternals = function(obj) {
    ['onEnter', 'onUpdate', 'onExit', 'key']
      .forEach(function(d) { delete obj[d] })

    return obj
  }

  patch = removeInternals(patch)

  if (!Object.keys(patch).length) return Promise.resolve(domNode)

  return Promise
      .all(onUpdate(vNode, domNode, {new: patch, old: removeInternals(vNode.properties)}))
      .then(function() {
        applyProperties(domNode, patch, vNode.properties)
        return domNode
      })
}
