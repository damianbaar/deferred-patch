var applyProperties = require("virtual-dom/vdom/apply-properties")

var isWidget = require("virtual-dom/vnode/is-widget")
var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vdom/update-widget")

module.exports = applyPatch

var getChildsOps = function(vNode, domNode, method) {
  var ops = []

  var getChildren = function(node, dom) {
    if (!dom) return

    var c

    (node.children || []).forEach(function(child, idx) {
      c = dom.children[idx]
      if(child.properties && child.properties[method]) {
        c && ops.push(child.properties[method](c));
      }
      // c && getChildren(child, c);
    })
  }

  var start = getChildren({ children: [vNode] }, { children:[domNode] })
  return ops.reverse()
}

var removeOp = function(node, domNode) { return getChildsOps(node, domNode, 'onExit') }
  , insertOp = function(node, domNode) { return getChildsOps(node, domNode, 'onEnter') }
  , updateOp = function(node, domNode) { return getChildsOps(node, domNode, 'onUpdate') }

var cause = 
  [ "NONE"
  , "VTEXT"
  , "VNODE"
  , "WIDGET"
  , "PROPS"
  , "ORDER"
  , "INSERT"
  , "REMOVE"
  , "THUNK"
  ]

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    console.log('applying patch:', cause[type])

    switch (type) {
        case VPatch.REMOVE:
          return new Promise(function(ok, err) {
            Promise
              .all(removeOp(vNode, domNode))
              .then(function(node) {
                removeNode(domNode, vNode)
                ok(domNode)
              })
          })
        case VPatch.INSERT:
          return new Promise(function(ok, err) {
            Promise
              .all(insertOp(patch, domNode))
              .then(function() {
                insertNode(domNode, patch, renderOptions)
                ok(domNode)
              })
          })
        case VPatch.VTEXT:
          var extend = function(patch, domNode) {
            patch.properties = patch.properties || {}
            patch.properties.onUpdate = domNode.onUpdate
            patch.properties.onExit = domNode.onExit
            patch.properties.onStart = domNode.onStart
            return patch
          }
          return new Promise(function(ok, err) {
            Promise
              .all(updateOp(extend(patch, domNode.parentNode), domNode.parentNode))
              .then(function() {
                stringPatch(domNode, vNode, patch, renderOptions)
                ok(domNode)
              })
          })
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            return reorderChildren(domNode, patch, vNode)
        case VPatch.PROPS:
          ['onEnter', 'onUpdate', 'onExit'].forEach(function(d) { delete patch[d] })
          if (!Object.keys(patch).length) return Promise.resolve(domNode)

          return new Promise(function(ok, err) {
            Promise
              .all(updateOp(vNode, domNode))
              .then(function() {
                ok(domNode)
                applyProperties(domNode, patch, vNode.properties)
              })
          })
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
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
    
    var props
    if (props = vNode.properties) {
      newNode.onEnter = props.onEnter
      newNode.onUpdate = props.onUpdate
      newNode.onExit = props.onExit
    }

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
      , _remove = function(node) { 
        if(domNode.contains(node))
          domNode.removeChild(node) 
      }

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        
        if(toRemove.indexOf(node) == -1) toRemove.push(node)
    }

    var toInsert = []
      , _insert = function(desc) { 
        if(domNode.contains(desc.node))
          domNode.insertBefore(desc.node, desc.idx) 
      }

    var length = childNodes.length

    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]

        // this is the weirdest bug i've ever seen in webkit
        var idx = insert.to >= length++ ? null : childNodes[insert.to]
        toInsert.push({ node: node, idx: idx })
    }

    return new Promise(function(ok, err) {
      Promise
        //rething it a bit ... filter out appropriately insert + remove
        .all(removeOp(vnode, domNode).concat(insertOp(vnode, domNode)))
        .then(function() {
          toRemove.forEach(_remove)
          toInsert.forEach(_insert)
          ok(domNode)
        })
    })
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}
