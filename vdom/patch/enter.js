var traverse = require('./traverse-vdom-dom')

var onEnter = function(node, domNode) { 
  return traverse(node, domNode, function(vNode, domNode, goDeeper) {
    var props = vNode.properties 
    goDeeper(vNode, domNode)
    if(props && props.onEnter) return props.onEnter(domNode, props)
  })
}

module.exports = function insertNode(domNode, vpatch, renderOptions) {
  var patch = vpatch.patch
    , newNode = renderOptions.render(patch, renderOptions)

  if (domNode) domNode.appendChild(newNode)

  return Promise
    .all(onEnter(patch, newNode))
    .then(function() { return domNode })
}
