var applyProperties = require("virtual-dom/vdom/apply-properties")

var isWidget = require("virtual-dom/vnode/is-widget")
var VPatch = require("virtual-dom/vnode/vpatch")

var updateWidget = require("virtual-dom/vnode/update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
          console.log('remove', domNode, vNode)
            return new Promise(function(ok, err) {
              var children = []

              var getChildren = function(node, domNode) {
                if (!domNode) return

                (node.children || []).forEach(function(child, idx) {
                  if(child.properties && child.properties.onRemove) {
                    children.push(child.properties.onRemove(domNode.children[idx]))
                  }
                  getChildren(child, domNode && domNode.children[idx])
                })
              }

              getChildren({children: [vNode]}, {children:[domNode]})

              return new Promise(function(ok, err) {
                Promise.all(children).then(function() {
                  removeNode(domNode, vNode)
                  ok(domNode)
                })
              })
            })
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
          console.log('text')
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            // return new Promise(function(ok, err) {
            //     reorderChildren(domNode, patch, vNode)
            //   .then(function() {
            //     ok(domNode)
            //   })
            // })
                reorderChildren(domNode, patch, vNode)
            return domNode
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
    var r 
    var children = []

    var getChildren = function(node, domNode) {
      if (!domNode) return

      (node.children || []).forEach(function(child, idx) {
        if(child.properties && child.properties.onRemove) {
          children.push(child.properties.onRemove(domNode.children[idx]))
        }
        getChildren(child, domNode && domNode.children[idx])
      })
    }

    getChildren({children: [leftVNode]}, {children:[domNode]})

    return new Promise(function(ok, err) {
      Promise.all(children).then(function() {
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

    var children

    // function getChildren(node, domNode) {
    //   if (!domNode) return
    //
    //   ((node && node.children) || []).forEach(function(child, idx) {
    //     if(child.properties && child.properties.onRemove) {
    //       children.push(child.properties.onRemove(domNode.children[idx]))
    //     }
    //     getChildren(child, domNode && domNode.children[idx])
    //   })
    // }
    //
    // var p = new Promise(function(ok,err) {
    //   var remove = []
    //
      for (var i = 0; i < moves.removes.length; i++) {
          remove = moves.removes[i]
          node = childNodes[remove.from]
          if (remove.key) {
              keyMap[remove.key] = node
          }

          // getChildren({children: node}, {children: [vnode.children[remove.from]]})

          // remove.push(function() { domNode.removeChild(node) })
          domNode.removeChild(node)
      }

    //   Promise.all(children).then(function(){
    //     remove.forEach(function(r) { r() })
    //   })
    // })

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }

    // return p
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}
