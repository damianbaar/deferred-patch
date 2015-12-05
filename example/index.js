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

    tree = newtree
  }

var Velocity = require('velocity-animate')

var onEnter = function(delay) {
  return function(node, props) {
    // console.log('onEnter', props)
    node.style.position = 'absolute'
    return new Promise(function(ok, err) {
      node.style.opacity = 0
      Velocity(node, 
        { opacity: 1, backgroundColor: props.color, width: props.data 
        , translateY: props.to * 22 + 'px'
        }
      , { complete: ok }
      )
    })
  }
}

var onUpdate = function(delay) {
  return function(node, props) {
    console.log('onUpdate', node.from, node.to)
    return new Promise(function(ok, err) {
      ok()
      Velocity(node, 
        { backgroundColor: props.new.color, width: props.new.data 
        , translateY: node.to * 22 + 'px'
        , opacity: 1
        }
      )
    })
  }
}

var onExit = function(delay) {
  return function(node) {
    // console.log('onExit', node)
    return new Promise(function(ok, err) {
      Velocity(node, 
        { opacity: 0, color: '#FF0000', width: 0 }
      , { duration: 100, complete: ok }
      )
    })
  }
}

var onReorder = function(delay) {
  return function(node, props) {
    console.log('onReorder', 'from', props.from, 'to', props.to)

    // if(props.to == -1) {
    //   props.to = 10
    //   // debugger
    //   // rootNode.appendChild(node)
    // }
    ok()
    return new Promise(function(ok, err) {
      Velocity(node, 
        { translateY: props.to * 22 + 'px' }
      , { complete: ok }
      )
    })
    }
  }


var lifecycle = function(custom) {
  // delete custom.key
  return Object.assign(custom || {}, {    
      onEnter: onEnter(100)
    , onUpdate: onUpdate(100)
    , onExit: onExit(100)
    , onReorder: onReorder(100)
  })
}

var c = 0

function run() {
  var root = h('span.root') //dont attach lifecycle to root
    , kids = []
    , redraw

  for (var i = 0; i < 8;i ++) {
     var color = '#' + Math.floor(Math.random()*16777215).toString(16)
     kids.push(h('div.bar', lifecycle({key:'fancy'+i, data: 50 + 50*(i + 2)*Math.random(), color: color}), ['Bar'+i]))
  }

  if (c % 2 == 0) {
    kids.splice(1,1)
    kids.splice(3,1)
    kids = kids.reverse()
  }


  redraw = h('button', {key:'redraw', 'onclick': function() { run(c++) }}, ['redraw'])

  root.children = [h('div.container', kids), redraw]
  update(root)
}

run(c++)
