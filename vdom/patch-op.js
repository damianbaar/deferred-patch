var applyProperties = require("virtual-dom/vdom/apply-properties")
var isArray = require("x-is-array")

var isWidget = require("virtual-dom/vnode/is-widget")
var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vdom/update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
          return Promise
              .all(removeOp(vNode, domNode))
              .then(function() {
                return removeNode(domNode, vNode)
              })
        case VPatch.INSERT:
                return insertNode(domNode, patch, renderOptions)
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
        case VPatch.PROPS:
          var removeInternals = function(obj) {
            ['onEnter', 'onUpdate', 'onExit', 'key']
              .forEach(function(d) { delete obj[d] })

            return obj
          }

          patch = removeInternals(patch)

          if (!Object.keys(patch).length) return Promise.resolve(domNode)

          return Promise
              .all(updateOp(vNode, domNode, {old: patch, new: removeInternals(vNode.properties)}))
              .then(function() {
                applyProperties(domNode, patch, vNode.properties)
                return domNode
              })
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

//haha stoped to understand what it is doing, rewrite it!
var getChildsOps = function(vNode, domNode, method, props, deep) {
  var ops = []

  var getChildren = function(node, tree) {
    if (!tree) return

    var domNode

    (node.children || []).forEach(function(child, idx) {
      domNode = tree.children[idx]
      if(child.properties && child.properties[method] && domNode) {
        //sometimes there are two updates, first one related to tag.class is not relevant, so skipping it
        var skip = Object.keys(props || {}).length == 1 && (props || {}).className;
        ops.push(child.properties[method](domNode, skip ? (child.properties || props) : (props || child.properties)))
      } else if(domNode && domNode[method]) {
        ops.push(domNode[method](domNode, props || child.properties))
      }
      deep && getChildren(child, domNode);
    })
  }

  var start = getChildren({ children: isArray(vNode) ? vNode : [vNode] }
                         ,{ children: isArray(domNode) ? domNode : [domNode] })
  return ops.reverse()
}

var removeOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onExit', props, deep) }
  , insertOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onEnter', props, deep) }
  , updateOp = function(node, domNode, props, deep) { return getChildsOps(node, domNode, 'onUpdate', props, deep) }
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

  if (parentNode) parentNode.appendChild(newNode)

  return Promise
    .all(insertOp(vNode, newNode, vNode.properties || vNode, true))
    .then(function() {
      return parentNode
    })
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
