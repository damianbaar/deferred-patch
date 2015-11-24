var applyProperties = require("virtual-dom/vdom/apply-properties")

var isWidget = require("virtual-dom/vnode/is-widget")
var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vdom/update-widget")

module.exports = applyPatch

var getChildsOps = function(vNode, domNode, method) {
  var ops = []

  var getChildren = function(node, dom) {
    if (!dom) return

    (node.children || []).forEach(function(child, idx) {
      if(child.properties && child.properties[method]) {
        ops.push(child.properties[method](dom.children[idx]))
      }
      getChildren(child, dom.children[idx])
    })
  }

  var start = getChildren({ children: [vNode] }, { children:[domNode] })
  return ops.reverse()
}

var removeOp = function(node, domNode) { return getChildsOps(node, domNode, 'onRemove') }
  , insertOp = function(node, domNode) { return getChildsOps(node, domNode, 'onEnter') }

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
          console.log('## remove')
          return new Promise(function(ok, err) {
            Promise
              .all(removeOp(vNode, domNode))
              .then(function() {
                removeNode(domNode, vNode)
                ok(domNode)
              })
          })
        case VPatch.INSERT:
          console.log('## insert')
          return new Promise(function(ok, err) {
            Promise
              .all(insertOp(patch, domNode))
              .then(function() {
                insertNode(domNode, patch, renderOptions)
                ok(domNode)
              })
          })
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
          console.log('## vnode patch')
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
          console.log('## order')
            return reorderChildren(domNode, patch, vNode)
            // return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
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

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode

    return new Promise(function(ok, err) {
      Promise
        .all(removeOp(leftVNode, domNode))
        .then(function() {
          var newNode = renderOptions.render(vNode, renderOptions)

          if (parentNode && newNode !== domNode) {
              parentNode.replaceChild(newNode, domNode)
          }

          ok(newNode)
        })
    })
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}


function reorderChildren(domNode, moves, vnode) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    var toRemove = []
      , _remove = function(node) { domNode.removeChild(node) }

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }

        toRemove.push(node)
    }

    var toInsert = []
      , _insert = function(desc) { domNode.insertBefore(desc.node, desc.idx) }

    var length = childNodes.length

    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]

        // this is the weirdest bug i've ever seen in webkit
        var idx = insert.to >= length++ ? null : childNodes[insert.to]
        toInsert.push({ node: node, idx: idx })
    }

    return new Promise(function(ok, err) {
      console.log('##', removeOp(vnode, domNode).concat(insertOp(vnode, domNode)))

      Promise
        .all(removeOp(vnode, domNode).concat(insertOp(vnode, domNode)))
        .then(function() {
          console.log('child order')
          setTimeout(function() {
            toRemove.forEach(_remove)
            toInsert.forEach(_insert)
            console.log('child order','done')
            ok(domNode)
          },1000)
        })
    })
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}
