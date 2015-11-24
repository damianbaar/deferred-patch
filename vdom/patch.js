var isArray = require("x-is-array")

var render = require("virtual-dom/vdom/create-element")
var domIndex = require("virtual-dom/vdom/dom-index")
var patchOp = require("./patch-op")

module.exports = defferedPatch

function defferedPatch(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return Promise.all([Promise.resolve(rootNode)])
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    var operations = indices.map(function(idx) {
      return applyPatch(
              rootNode,
              index[idx],
              patches[idx],
              renderOptions)
    })

    return new Promise(function(ok, err) {
      Promise
        .all(operations)
        .then(function(res) {
          ok(isArray(res) ? res[0] : res)
        })
    })
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
  if (!domNode) return rootNode

  var newNode
  var defferedPatches = []

  if (!isArray(patchList)) patchList = [patchList]

  for (var i = 0; i < patchList.length; i++) {
    defferedPatches.push(new Promise(function(ok, err) {
      newNode = patchOp(patchList[i], domNode, renderOptions)

      if(newNode.then) {
        newNode.then(function(node) { 
          rootNode = isArray(node) ? node[0] : node
          if (domNode === rootNode) rootNode = newNode
          ok(newNode) 
        })
      } else {
        if (domNode === rootNode) rootNode = newNode
        ok(newNode)
      }
    }))
  }

  return new Promise(function(ok, err) {
    Promise
      .all(defferedPatches)
      .then(function(node) {
        ok(node[Math.max(0, node.length - 1)])
      })
  })
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
