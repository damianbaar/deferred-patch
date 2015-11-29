var isArray = require("x-is-array")
  , render = require("virtual-dom/vdom/create-element")
  , domIndex = require("virtual-dom/vdom/dom-index")
  , patchOp = require("./patch-op")

module.exports = function defferedPatch(rootNode, patches, renderOptions) {
  var indices = patchIndices(patches)

  if (indices.length === 0) return Promise.resolve(rootNode)

  var index = domIndex(rootNode, patches.a, indices)
    , ownerDocument = rootNode.ownerDocument

  if (!renderOptions.document && ownerDocument !== document)
      renderOptions.document = ownerDocument

  var patchIndex = []

  indices.forEach(function(d) {
    var idx = d
      , patch = patches[idx]

    if (!isArray(patch)) patch = [patch]

    patch.forEach(function(d) { patchIndex.push({idx: idx, patch: d}) }) 
  })

  var operations = patchIndex.map(function(d) {
    return function(rootNode) {
      return function(ok) {
        var patch = applyPatch(index[d.idx], d.patch, renderOptions)
        if (patch && patch.then) patch.then(function(node) { ok(rootNode) })
        else ok(rootNode)
      }
    }
  })
  
  return new Promise(function(ok, err) {
    var p = Promise.resolve(rootNode)
      , operationIndex = 0

    var takeNext = function(p) {
      p.then(function(node) {
        if( operationIndex == operations.length ) return ok(node)
        if (rootNode === node) rootNode = node

        takeNext(new Promise(operations[operationIndex](node)))
        operationIndex++
      })
    }

    takeNext(p)

  }).then(function(dom) { return dom })
}

function applyPatch(domNode, patchList, renderOptions) {
  return patchOp(patchList, domNode, renderOptions)
}

function patchIndices(patches) {
    var indices = []
    for (var key in patches) (key !== "a") && indices.push(Number(key));
    return indices
}
