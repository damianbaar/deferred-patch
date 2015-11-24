var h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')

var defferedPatch = require('../index')

var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var update = function(newtree) {
    patches = diff(tree, newtree)
    var a = patch(rootNode, patches, { patch: defferedPatch })

    a.then(function(d) {
      console.log('current render',d)
      rootNode = d[0]
    })
    tree = newtree
  }

var onRemove = function(delay) {
  return function(node) {
    return new Promise(function(ok, err) {
      node.style.color = '#DDEEFF' //mark as to be removed

      setTimeout(function() {
        node.style.color = '#FF0000'
        setTimeout(ok, 200)
      }, delay)
    })
  }
  }

update(h('span', 
         [ h('div', {onRemove:onRemove(100)}, ['child1']),
           h('div', {onRemove:onRemove(200)}, ['child2']),
           h('div', {}, [ 
             h('div', {onRemove:onRemove(300)}, ['nested child1']),
             h('div', {}, [ h('div', {}, [ 
               h('div', {onRemove:onRemove(500)}, ['nested child1']),
               h('div', {onRemove:onRemove(600)}, ['nested child2']),
               ])
             ])
           ])
         ]))

  setTimeout(function() {
  // update(h('span', 
  //          [ h('div', {onRemove:onRemove(100)}, ['child1']),
  //            h('div', {key: 2}, [ 
  //              h('div', {onRemove:onRemove(300)}, ['nested child1']),
  //              h('div', {key:3, onRemove:onRemove(400)}, [ h('div', {}, [ 
  //                h('div', {onRemove:onRemove(500)}, ['nested child1']),
  //                h('div', {onRemove:onRemove(900)}, ['nested child5'])
  //                ])
  //              ])
  //            ]),
  //          'middle'])) //calling unhook
    update(h('div.text', { onRemove: onRemove(1000) },['test'] ))
    setTimeout(function() {
      update(h('span', {}, h('div', {}, ['END!'])))
    }, 5000)
  }, 3000)
