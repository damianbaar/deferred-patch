var applyProperties = require("virtual-dom/vdom/apply-properties")
  , traverse = require('./traverse-vdom-dom')

var getChildIndex = function(dom, node) {
    return [].indexOf.call(dom, node)
}

var onUpdate = function(node, domNode, props) { 
  return traverse(node, domNode, function(vNode, domNode) {
    if(domNode && domNode.onUpdate) {
      domNode.to = props.to = getChildIndex(domNode.parentNode.children, domNode)
      return domNode.onUpdate(domNode, props)
    }
  })
}

var combineState = function(_new, _old) {
  return { new: _new, old: _old}
}

module.exports = function(domNode, vpatch) {
  var vNode = vpatch.vNode
  var patch = vpatch.patch

  if (!Object.keys(patch).length) return Promise.resolve(domNode)
  var states = combineState(patch, vNode.properties)

  return Promise
      .all(onUpdate(vNode, domNode, states))
      .then(function() {
        applyProperties(domNode, patch, vNode.properties)
        return domNode
      })
}
