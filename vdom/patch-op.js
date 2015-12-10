var VPatch = require("virtual-dom/vnode/vpatch")
  , updateWidget = require("virtual-dom/vdom/update-widget")

module.exports = applyPatch

var patches = (function() {
  var patches = {}

  patches[VPatch.REMOVE] = require('./patch/exit')
  patches[VPatch.INSERT] = require('./patch/enter')
  patches[VPatch.PROPS] = require('./patch/update')
  
  return patches  
})()
var onUpdate = function(node, domNode, props) { 
  return traverse(node, domNode, function(vNode, domNode) {
    if(domNode && domNode.onUpdate) return domNode.onUpdate(domNode, props)
  })
}
var t = ["NONE"
,"VTEXT" 
,"VNODE"
,"WIDGET" 
,"PROPS" 
,"ORDER"
,"INSERT" 
,"REMOVE" 
,"THUNK"]

function applyPatch(vpatch, domNode, renderOptions) {
  console.log(t[vpatch.type], vpatch.type, vpatch)
  var type = vpatch.type

  if (patches[type]) return patches[type](domNode, vpatch, renderOptions)

    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
      case VPatch.VTEXT:
        // return Promise//.resolve()
        //     .all(onUpdate(patch, domNode.parentNode))
        //     .then(function() {
        return stringPatch(domNode, vNode, patch, renderOptions)
      // })
      case VPatch.WIDGET:
        return widgetPatch(domNode, vNode, patch, renderOptions)
      case VPatch.VNODE:
        return vNodePatch(domNode, vNode, patch, renderOptions)
      case VPatch.ORDER:
        return reorderChildren(domNode, patch, vNode)
      case VPatch.THUNK:
        var newDom = renderOptions.patch(domNode, patch, renderOptions)
        if(newDom && newDom.then) {
          return newDom.then(function(newDom) {
            return replaceRoot(domNode, newDom)
          })
        } else {
          return replaceRoot(domNode, newDom)
        }
        default:
          return domNode
    }
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
  var newNode

  if (domNode.nodeType === 3) {
    domNode.replaceData(0, domNode.length, vText.text)
    newNode = domNode
  } else {
    var parentNode = domNode.parentNode
    newNode = renderOptions.render(vText, renderOptions)
    
    if(newNode && newNode.then) {
      return newNode.then(function(node) {
        if (parentNode && node !== domNode) {
          parentNode.replaceChild(node, domNode)
        }
      })
    }

    if (parentNode && newNode !== domNode) {
      parentNode.replaceChild(newNode, domNode)
    }
  }

  return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
  var updating = updateWidget(leftVNode, widget)
  var newNode

  if (updating) {
    newNode = widget.update(leftVNode, domNode) || domNode
  } else {
    newNode = renderOptions.render(widget, renderOptions)
  }

  var parentNode = domNode.parentNode

  if (parentNode && newNode !== domNode) {
    parentNode.replaceChild(newNode, domNode)
  }

  if (!updating) {
    destroyWidget(domNode, leftVNode)
  }

  return newNode
}

function destroyWidget(domNode, w) {
  if (typeof w.destroy === "function" && isWidget(w)) {
    w.destroy(domNode)
  }
}

function replaceRoot(oldRoot, newRoot) {
  if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
    oldRoot.parentNode.replaceChild(newRoot, oldRoot)
  }

  return newRoot;
}

var traverse = require('./patch/traverse-vdom-dom')

var removeOp = function(node, domNode) { 
  return traverse(node, domNode, function(vNode, domNode) {
    console.log(domNode.node, domNode.onExit)
    if(!(domNode && domNode.onExit)) return
    return domNode.onExit(domNode, domNode)
  })
}

var reorderOp = function(node, domNode, position) { 
  return traverse(node, domNode, function(vNode, domNode) {
    // console.log(domNode.node, domNode.onReorder)
    // if(domNode.onReorder) return domNode.onReorder(domNode, domNode)
    if(!(domNode && domNode.node && domNode.node.onReorder)) return
    return domNode.node.onReorder(domNode.node, domNode)
  })
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
  var parentNode = domNode.parentNode

  return Promise
  .all(removeOp(leftVNode, domNode))
  .then(function() {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
      parentNode.replaceChild(newNode, domNode)
    }

    return newNode
  })
}

//TODO refactor it
function reorderChildren(domNode, moves, vnode) {
  var childNodes = domNode.childNodes
    , node
    , remove
    , insert
    , keyMap = {}

  for(var i = 0; i < childNodes.length; i++) { 
    childNodes[i].setAttribute('__from__', i)
    childNodes[i].setAttribute('__to__', -1)
    childNodes[i].setAttribute('__id__', i)
  }

  var getChildIndex = function(dom, node) { return [].indexOf.call(dom, node) }
  var _domNode = domNode.cloneNode(true)
  childNodes = _domNode.childNodes

  var removed = []
    , inserted = []

  for(var i = 0; i < childNodes.length; i++) { 
    var c = childNodes[i]
    c.from = c.getAttribute('__from__')
    c.to = c.getAttribute('__to__')
    c.id = c.getAttribute('__id__')
  }

  for (var i = 0; i < moves.removes.length; i++) {
    remove = moves.removes[i]
    node = childNodes[remove.from]
    if (remove.key) keyMap[remove.key] = node
      _domNode.removeChild(node)
    removed.push(node)
  }

  var next = childNodes.length
  for (var j = 0; j < moves.inserts.length; j++) {
    insert = moves.inserts[j]
    node = keyMap[insert.key]
    _domNode.insertBefore(node, insert.to >= next++ ? null : childNodes[insert.to])
    node.to = getChildIndex(childNodes, node)
    inserted.push(node)
  }

  removed = removed.filter(function(d) { return inserted.indexOf(d) == -1 })

  childNodes = domNode.childNodes
  var getReal = function(id) {
    for(var i = 0; i < childNodes.length; i++) {
      var o = childNodes[i]
      if(o.getAttribute('__id__') == id) return o
    }
  }

  removed = removed.map(function(d) { return getReal(d.id) })
  inserted = inserted.map(function(d) { return getReal(d.id) })

  var rest = []
  for(var i = 0; i < childNodes.length; i++) {
    var c = childNodes[i]
    if (removed.indexOf(c) == -1 && inserted.indexOf(c) == -1) {
      rest.push(c)
    }
  }

  inserted = inserted.concat(rest)

  return Promise
    .all(removeOp(removed, removed).concat(reorderOp(vnode, inserted)))
    .then(function() {
      var childNodes = domNode.childNodes
        , keyMap = {}

      for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) keyMap[remove.key] = node
          domNode.removeChild(node)
      }

      var next = childNodes.length
      for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        domNode.insertBefore(node, insert.to >= next++ ? null : childNodes[insert.to])
      }
      return domNode
    })
}
