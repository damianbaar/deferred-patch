var h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')

var defferedPatch = require('../index')

var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var busy = false
var update = function(newtree) {
    if(busy) return false

    patches = diff(tree, newtree)

    busy = true
    var a = patch(rootNode, patches, { patch: defferedPatch })

    a.then(function(d) {
      console.log('### render', d)
      rootNode = d
      busy = false
    })
      // console.log('### render', a)
      // rootNode = a

    tree = newtree
  }

var Velocity = require('velocity-animate')

var onEnter = function(delay) {
  return function(node, props) {
    console.log('onEnter', node)
    return new Promise(function(ok, err) {
      node.style.opacity = 0
      Velocity(node, 
        { opacity: 1, color: '#00FF00' }
      , { complete: ok }
      )
    })
  }
}

var onUpdate = function(delay) {
  return function(node, props) {
    console.log('onUpdate', node, props)
    return new Promise(function(ok, err) {
      var color = '#' + Math.floor(Math.random()*16777215).toString(16)
      Velocity(node, 
        { color: color }
      , { complete: ok }
      )
    })
  }
}

var onExit = function(delay) {
  return function(node) {
    //temp workaroudn
    if(!document.contains(node)) return Promise.resolve()
    console.log('onExit', node)

    return new Promise(function(ok, err) {
      Velocity(node, 
        { opacity: 0, color: '#FF0000' }
      , { complete: ok() }
      )
    })
  }
  }


var lifecycle = function(custom) {
  return Object.assign(custom || {}, {    
      onEnter: onEnter(100)
    , onUpdate: onUpdate(100)
    , onExit: onExit(100)
  })
}

var c = 0
function run() {
  var root = h('span', lifecycle())
    , kids = 
     [ h('div', lifecycle({key:1, styles: c > 1 ? ['ab','cd'] : ['awesome']}), ['child1']),
       h('div', lifecycle({key:2, iteration: c}), ['child2']),
       h('div', lifecycle({key:3, data: Math.random()}), ['child3']),
       h('button', {key:4, 'onclick': function() { run(c++) }}, ['redraw'])
     ]

  if (c % 2 == 0) kids = kids.concat([
   h('div', lifecycle(), ['short lived kid'])
  ]).reverse()

  root.children = kids 
  update(root)
}

run(c++)
