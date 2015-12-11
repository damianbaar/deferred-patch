var h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')

var defferedPatch = require('../index')
  , cElement = require('../vdom/createElement')

var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var busy = false

var update = function(newtree) {
    if(busy) return false

    patches = diff(tree, newtree)

    busy = true

    var a = patch(rootNode, patches, { diff: diff, patch: defferedPatch, render: cElement })

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
    // node.style.position = 'absolute'
    // node.style.opacity = 0
    return new Promise(function(ok, err) {
      ok()
      // Velocity(node, 
      //   { opacity: 1, backgroundColor: props.color, width: props.data 
      //   , translateY: props.to * 22 + 'px'
      //   }
      // // , { complete: ok }
      // )
    })
  }
}

var onUpdate = function(delay) {
  return function(node, props) {
    console.log('onUpdate', node.from, node.to)
    node.style.position = 'absolute'
    // node.style.opacity = 0
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
    console.log('onExit')
    return new Promise(function(ok, err) {
      ok()
      // Velocity(node, 
      //   { opacity: 0, color: '#FF0000', width: 0 }
      // , { duration: 100, complete: ok }
      // )
    })
  }
}

var onReorder = function(delay) {
  return function(node, props) {
    console.log('onreorder')
    node.style.position = 'absolute'
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
  , flip = false

function run(counter, flip) {
  var root = h('span.root') //dont attach lifecycle to root
    , kids = []
    , redraw
    , flipOp

  for (var i = 0; i < 8;i ++) {
     var color = '#' + Math.floor(Math.random()*16777215).toString(16)
     kids.push(h('div.bar', lifecycle({key:'fancy'+i, data: 50 + 50*(i + 2)*Math.random(), color: color}), ['Bar'+i]))
  }

  // if (c % 2 == 0) {
  //   kids.splice(1,1)
  //   kids.splice(3,1)
  // }

  if(flip)
    kids = kids.reverse()

  redraw = h('button', {key:'redraw', 'onclick': function() { run(c++, !flip) }}, ['redraw'])
  flipOp = h('input', {key:'flip', type: 'checkbox', 'onclick': function() { run(c++, true) }}, ['redraw'])
  
  var ConstantlyThunk = function(greeting){
    this.greeting = greeting
    this.type = 'Thunk'
  }

  ConstantlyThunk.prototype.render = function(previous) {
    var _c = []
    for (var i = 0; i < 8;i ++) {
       var color = '#' + Math.floor(Math.random()*16777215).toString(16)
       _c.push(h('div.bar', lifecycle({key:'fancy#'+i, data: 50 + 50*(i + 2)*Math.random(), color: color}), ['Bar'+i]))
    }

    return h('div', lifecycle(), _c)
  }

  Thunk1 = new ConstantlyThunk("Thunk!" + c)

  var deffered = function(delay) {
    var a
      , loaded = false
    return { 
      type: 'Widget'
    , deffered: true
    , render: function(ok) {
        var markup = function() {
          console.log('####', delay, c)
          var _c = []
          for (var i = 0; i < 8;i ++) {
             var color = '#' + Math.floor(Math.random()*16777215).toString(16)
             _c.push(h('div.bar', lifecycle({key:'fancy#'+i, data: 50 + 50*(i + 2)*Math.random(), color: color}), ['Bar'+i]))
          }

          if(flip)
            _c.reverse()

          // loaded = true

          return ok(h('div', lifecycle(), _c))
        }
        
        return !loaded ? setTimeout(markup, delay) : markup()
      }
    }
  }

  // root.children = [h('div.container', kids), redraw, flipOp, deffered(300), deffered(1000)]
  root.children = [redraw, deffered(100), Thunk1]//deffered(1000)]

  // if(c %2 ==0) {
    // root.children.push(Thunk1)
  // }

  // var select = require('vtree-select')

  update(root)
}

run(c++, false)

//vtree-create
//works on array
//insert, append, text (VText), css, style
//consider: animation
//
