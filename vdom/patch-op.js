var isArray = require("x-is-array")

var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vdom/update-widget")

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
      , node
      , remove

    var toRemove = []

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (!remove.key) toRemove.push(node)
    }
    //TO CONSIDER: hook for reordering
    return Promise
      .all(removeOp(vnode, toRemove))
      .then(function() {
        var keyMap = {}
        var insert
        for (var i = 0; i < moves.removes.length; i++) {
            remove = moves.removes[i]
            node = childNodes[remove.from]
            if (remove.key) {
                keyMap[remove.key] = node
            }
            domNode.removeChild(node)
        }

        var length = childNodes.length
        for (var j = 0; j < moves.inserts.length; j++) {
            insert = moves.inserts[j]
            node = keyMap[insert.key]
            domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
        }

        return domNode
      })
}
