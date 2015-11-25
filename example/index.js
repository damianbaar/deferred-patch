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

    if(a.then)
      a.then(function(d) {
        console.log('### render', d)
        rootNode = d
      })
    else {
      rootNode = a
    }

    tree = newtree
  }

var onEnter = function(delay) {
  return function(node) {
    return new Promise(function(ok, err) {
      console.log('onEnter', node)
      node.style.color = '#00FF00'
      setTimeout(ok, delay)
    })
  }
}

var onUpdate = function(delay) {
  return function(node) {
    console.log('onUpdate', node)
    return new Promise(function(ok, err) {
      node.style.color = '#0000FF'
      setTimeout(ok, delay)
    })
  }
}

var onExit = function(delay) {
  return function(node) {
    console.log('onExit', node)
    return new Promise(function(ok, err) {
      node.style.color = '#FF0000'
      setTimeout(ok, delay)
    })
  }
  }


var cumulativeDelay = function(val) { this.total = 0 }
cumulativeDelay.prototype.take = function(val) { this.total += val; return val }

var delay = new cumulativeDelay()

var lifecycle = function(custom) {
  return Object.assign(custom || {}, {    
      onEnter: onEnter(delay.take(1000)*Math.random())
    , onUpdate: onUpdate(delay.take(1000))
    , onExit: onExit(delay.take(1000*Math.random()))
  })
}

update(h('span', lifecycle(),
         [ h('div', lifecycle({key:1}), ['child1']),
           h('div', lifecycle(), ['child2']),
           h('div', lifecycle(), ['child3']),
           h('div', lifecycle(), ['child4']),
           h('div', lifecycle(), ['child2']),
           h('div', lifecycle(), ['child3']),
           h('div', lifecycle(), ['child4']),
           h('div', lifecycle({key:5}), ['child5'])
         ]))

setTimeout(function() {
  update(h('span', lifecycle(), 
           [ h('div', lifecycle({key:1}), ['child1']),
             h('div', lifecycle(), ['child2']),
             h('div', lifecycle(), ['child2']),
             h('div', lifecycle(), ['child3']),
             h('div', lifecycle({key:5}), ['child5'])
           ]))
  //
    // update(h('span', lifecycle(), ['END!']))
  // setTimeout(function() {
  //   update(h('span', lifecycle(), ['END!']))
  // }, delay.total)

}, 3000)
