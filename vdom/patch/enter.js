var isArray = require("x-is-array")

var run = function(vNode, domNode, method) {
  var ops = []

  var getHooks = function(node, tree) {
    if (!tree) return

    var domNode

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]
      if(child.properties && child.properties[method] && domNode)
        ops.push(child.properties[method](domNode, child.properties))

      getHooks(child, domNode);
    })
  }

  var start = getHooks({ children: isArray(vNode) ? vNode : [vNode] }
                      ,{ children: isArray(domNode) ? domNode : [domNode] })

  return ops.reverse()
}

var onEnter = function(node, domNode) { 
  return run(node, domNode, 'onEnter') 
}

module.exports = function insertNode(domNode, vpatch, renderOptions) {
  var vNode = vpatch.vNode
    , patch = vpatch.patch
    , newNode = renderOptions.render(patch, renderOptions)

  if (domNode) domNode.appendChild(newNode)

  return Promise
    .all(onEnter(patch, newNode))
    .then(function() { return domNode })
}
