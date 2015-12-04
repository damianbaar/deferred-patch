var traverse = require('./traverse-vdom-dom')

var getChildIndex = function(dom, node) {
    return [].indexOf.call(dom, node)
}

var onEnter = function(node, domNode) { 
  return traverse(node, domNode, function(vNode, domNode, goDeeper) {
    var props = vNode.properties 
   requestAnimationFrame(function() {
    if(domNode && domNode.parentNode) {
      props.to = getChildIndex(domNode.parentNode.children, domNode)
    }
    if(props && props.onEnter) return props.onEnter(domNode, props)
  })
    goDeeper(vNode, domNode)
  })
}

module.exports = function insertNode(domNode, vpatch, renderOptions) {
  var patch = vpatch.patch
    //CONSIDER: filter out enter/exit and rest of the properties here
    , newNode = renderOptions.render(patch, renderOptions)

  if (domNode) domNode.appendChild(newNode)

  return Promise
    .all(onEnter(patch, newNode))
    .then(function() { return domNode })
}
