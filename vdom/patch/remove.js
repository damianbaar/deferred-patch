var destroyWidget = require('./destroy-widget')
  , isArray = require("x-is-array")

var run = function(vNode, domNode, method) {
  var removes = []
    , toArray = function(val) { return isArray(val) ? val : [val] }

  var getHooks = function(node, tree) {
    if (!tree) return

    var domNode
      , props

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]
      props = child.properties 

      if(!(domNode && props && props[method])) return

      removes.push(child.properties[method](domNode, child.properties))
    })
  }

  getHooks({ children: toArray(vNode) }
          ,{ children: toArray(domNode) })

  return removes.reverse()
}

var onExit = function(node, domNode) { 
  return run(node, domNode, 'onExit') 
}

module.exports = function(domNode, vpatch, renderOptions) {
  var vNode = vpatch.vNode
    , patch = vpatch.patch

  return Promise
          .all(onExit(vNode, domNode))
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
