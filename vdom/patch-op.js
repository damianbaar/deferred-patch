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

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type

    if (patches[type]) return patches[type](domNode, vpatch, renderOptions)

    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.VTEXT:
          return Promise
              .all(updateOp(patch, domNode.parentNode))
              .then(function() {
                return stringPatch(domNode, vNode, patch, renderOptions)
              })
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            return reorderChildren(domNode, patch, vNode)
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
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
    var props = vNode.properties 
    if(!(domNode && props && props.onExit)) return
    return props.onExit(domNode, props)
  })
}

var reorderOp = function(node, domNode, position) { 
  return traverse(node, domNode, function(vNode, domNode) {
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

function reorderChildren(domNode, moves, vnode) {
    var childNodes = domNode.childNodes
      , keyMap = {}

    var toRemove = []
      , toReorder = []

    var getChildIndex = function(dom, node) { return [].indexOf.call(dom, node) }

    var key = {}
      , node
      , remove
      , insert

    for (var i = 0; i < moves.removes.length; i++) {
      remove = moves.removes[i]
      node = childNodes[remove.from]
      if (remove.key) {
        key[remove.key] = remove.from
        keyMap[remove.key] = node
      }
      else toRemove.push(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
      insert = moves.inserts[j]
      var to = key[insert.key]
      toReorder.push(childNodes[to])
    }

    for (var j = 0; j < length; j++) {
      if(toReorder.indexOf(childNodes[j]) > -1) continue
      toReorder.push(childNodes[j])
    }

    toReorder = toReorder.map(function(p) {
      p.from = getChildIndex(childNodes, p)
      return p
    })

    var getToReorder = function(dom) {
      return toReorder.map(function(p) {
        p.to = getChildIndex(dom.children, p)
        return p
      })
    }

    return Promise
      .all(removeOp(vnode, toRemove))
      .then(function() {
        toRemove.forEach(function(node) { domNode.removeChild(node) })

        var next = childNodes.length
        for (var j = 0; j < moves.inserts.length; j++) {
            insert = moves.inserts[j]
            node = keyMap[insert.key]
            domNode.insertBefore(node, insert.to >= next++ ? null : childNodes[insert.to])
        }

        return domNode
      }).then(function(domNode) {
        return Promise
          .all(reorderOp(vnode.children, getToReorder(domNode)))
          .then(function(d) {
            return domNode 
          })
      })
}
