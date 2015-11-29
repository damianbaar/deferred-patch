var applyProperties = require("virtual-dom/vdom/apply-properties")
  , isArray = require("x-is-array")
  , traverse = require('./traverse-dom-vdom')

var onUpdate = function(node, domNode, props) { 
  return traverse(node, domNode, function(vNode, domNode) {
    if(domNode && domNode.onUpdate) return domNode.onUpdate(domNode, props)
  })
}

var removeLifecycle = function(obj) {
  ['onEnter', 'onUpdate', 'onExit', 'key']
    .forEach(function(d) { delete obj[d] })

  return obj
}

var combineState = function(_new, _old) {
  return { new: removeLifecycle(_new)
         , old:removeLifecycle(_old)}
}

module.exports = function(domNode, vpatch) {
  var vNode = vpatch.vNode
  var patch = vpatch.patch


  patch = removeLifecycle(patch)

  if (!Object.keys(patch).length) return Promise.resolve(domNode)

  var s = combineState(patch, vNode.properties)

  return Promise
      .all(onUpdate(vNode, domNode, s))
      .then(function() {
        applyProperties(domNode, patch, vNode.properties)
        return domNode
      })
}
