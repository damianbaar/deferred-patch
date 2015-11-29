var isArray = require("x-is-array")

var run = function(vNode, domNode, method) {
  var hooks = []
    , toArray = function(val) { return isArray(val) ? val : [val] }

  var getHooks = function(node, tree) {
    if (!tree) return

    var domNode

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]

      if(child.properties && child.properties[method] && domNode)
        hooks.push(child.properties[method](domNode, child.properties))

      getHooks(child, domNode) //add test for that vpatch.children = [...]
    })
  }

  getHooks({ children: toArray(vNode) }
          ,{ children: toArray(domNode) })

  return hooks
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
