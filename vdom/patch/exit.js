var destroyWidget = require('./destroy-widget')
  , isArray = require("x-is-array")
  , traverse = require('./traverse-dom-vdom')

var onExit = function(node, domNode) { 
  return traverse(node, domNode, function(vNode, domNode) {
    var props = vNode.properties 
    if(!(domNode && props && props.onExit)) return
    return props.onExit(domNode, props)
  })
}

module.exports = function(domNode, vpatch, renderOptions) {
  var vNode = vpatch.vNode
    , patch = vpatch.patch

  return Promise
          .all(onExit(vNode, domNode).reverse())
          .then(function() {
            removeNode(domNode, vNode)
            return domNode
          })
}

function removeNode(domNode, vNode) {
  var parentNode = domNode.parentNode
  if (parentNode) parentNode.removeChild(domNode)
  destroyWidget(domNode, vNode)
}
