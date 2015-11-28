var isArray = require("x-is-array")

var render = require("virtual-dom/vdom/create-element")
var domIndex = require("virtual-dom/vdom/dom-index")
var patchOp = require("./patch-op")

module.exports = defferedPatch

var opNo = 0

function defferedPatch(rootNode, patches, renderOptions) {
    console.log('--------> operation no', opNo++)

    var indices = patchIndices(patches)

    if (indices.length === 0) { return Promise.resolve(rootNode) }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    var __p = []

    indices.forEach(function(d) {
      var idx = d
        , patch = patches[idx]

      if (!isArray(patch)) patch = [patch]
      
      patch.forEach(function(d) {
        __p.push({idx: idx, patch: d})
      }) 
    })

    var operations = __p.map(function(d) {
      return function(__rootNode) {
        return function(ok) {
          var __c = applyPatch(index[d.idx], d.patch, renderOptions)
          if(__c && __c.then) {
            __c.then(function(node) {
              ok(__rootNode)
            })
          }else{
          ok(__rootNode)
          }
        }
      }
    })
    
    return new Promise(function(ok, err) {
      var p = Promise.resolve(rootNode)
        , z = 0

      var takeNext = function(p) {
        p.then(function(node) {
          if( z == operations.length ) return ok(node)
          if (rootNode === node) rootNode = node
          takeNext(new Promise(operations[z](node)))
          z++
        })
      }

      takeNext(p)
    }).then(function(dom) {
      return dom
    })
}

function applyPatch(domNode, patchList, renderOptions) {
  if (!domNode) return rootNode
  return patchOp(patchList, domNode, renderOptions)
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}
