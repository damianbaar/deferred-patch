var traverse = require('./traverse-vdom-dom')

var getChildIndex = function(dom, node) {
    return [].indexOf.call(dom, node)
}

var onEnter = function(node, domNode) { 
  return traverse(node, domNode, function(vNode, domNode, goDeeper) {
    var props = vNode.properties || domNode
     requestAnimationFrame(function() {
      if(domNode && domNode.parentNode) {
        props.to = getChildIndex(domNode.parentNode.children, domNode)
        domNode.from = props.to //TOOD eh ...
      }
      if(props && props.onEnter) return props.onEnter(domNode, props)
    })
    goDeeper(vNode, domNode)
  })
}

module.exports = function insertNode(domNode, vpatch, renderOptions) {
  var patch = vpatch.patch
    //CONSIDER: filter out enter/exit and rest of the properties here
  //

  patch = typeof patch == 'function' ? new Promise(patch) : patch
  var newNode = renderOptions.render(patch, renderOptions)
  
  if (newNode && newNode.then) {
    return newNode
    .then(function(node) {
      vpatch
      if (domNode) {
        domNode.appendChild(node)
        newNode = node
      }
      return node
    })
    .then(function(dom) {
      return Promise
        .all(onEnter(patch.vnode || patch, newNode))
        .then(function() { 
          return domNode 
        })
    })
    .then(function() {
      return domNode
    })
  }

  if (domNode && newNode) domNode.appendChild(newNode)

  return Promise
    .all(onEnter(patch.vnode || patch, newNode))
    .then(function() { return domNode })
}
