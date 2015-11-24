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
    console.log('onRemove hook',node)
    return new Promise(function(ok, err) {
      node.style.color = '#FF0000'//mark as to be removed
      setTimeout(ok, delay)
    })
  }
  }

var onEnter = function(delay) {
  return function(node) {
    console.log('onEnter hook', node)
    return new Promise(function(ok, err) {
      node.style.color = '#00FF00'
      setTimeout(ok, delay)
    })
  }
}

var onUpdate = function(delay) {
  //TODO
}

var cumulativeDelay = function(val) { this.total = 0 }
cumulativeDelay.prototype.take = function(val) { this.total += val; return val }

var delay = new cumulativeDelay()

update(h('span', 
         [ h('div', {onRemove:onRemove(delay.take(100)), onEnter: onEnter(delay.take(100))}, ['child1']),
           h('div', {onRemove:onRemove(delay.take(200))}, ['child2']),
           h('div', {key: 2, onEnter: onEnter(delay.take(1000))}, [ 
             h('div', {onRemove:onRemove(delay.take(300))}, ['nested child1']),
             h('div', {}, [ h('div', {}, [ 
               h('div', {onRemove:onRemove(delay.take(500))}, ['nested child1']),
               h('div', {onRemove:onRemove(delay.take(600))}, ['nested child2']),
               ])
             ])
           ])
         ]))

  setTimeout(function() {
  // update(h('span', 
  //          [ h('div', {onRemove:onRemove(delay.take(100))}, ['child1']),
  //            h('div', {key: 2}, [ 
  //              h('div', {onRemove:onRemove(delay.take(300))}, ['nested child1']),
  //              h('div', {key:3, onRemove:onRemove(delay.take(400))}, [ h('div', {}, [ 
  //                h('div', {onRemove:onRemove(delay.take(500))}, ['nested child1']),
  //                h('div', {onRemove:onRemove(delay.take(600))}, ['nested child5'])
  //                ])
  //              ])
  //            ]),
  //          ])) 
    update(h('div.text', { onRemove: onRemove(delay.take(1000)), onEnter: onEnter(delay.take(1000)) },['test'] ))

    console.log('Animations duration: ', delay.total)

    setTimeout(function() {
      update(h('span', {}, h('div', {}, ['END!'])))
    }, delay.total)
  }, delay.total)
