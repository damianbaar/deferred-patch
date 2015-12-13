var _h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')

var defferedPatch = require('../index')
  , cElement = require('../vdom/createElement')

var h = function(tag, props, children) {
  if (_.isArray(props)) return _h(tag, props, children)
  if (!props) return _h(tag, props, children)
return _h(tag, processObject(props), children)
}

var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var busy = false

var update = function(newtree) {
    if(busy) return false

    patches = diff(tree, newtree)

    // busy = true
    // var a = patch(rootNode, patches)//, { diff: diff, patch: defferedPatch, render: cElement })
    var a = patch(rootNode, patches, { diff: diff, patch: defferedPatch, render: cElement })

      // rootNode = a
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
      return Velocity(node, 
        { opacity: 1, backgroundColor: props.color, width: props.data 
        , translateY: props.to * 22 + 'px'
        }
        , { begin: function() {
          node.style.position = 'absolute'
          node.style.opacity = 0
        } 
        })
  }
      // , { complete: ok }
}

var onUpdate = function(delay) {
  return function(node, props) {
    // console.log('onUpdate', node.from, node.to)
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
    // console.log('onExit')
    return new Promise(function(ok, err) {
      ok()
      Velocity(node, 
        { opacity: 0, color: '#FF0000', width: 0 }
      , { duration: 100, complete: ok }
      )
    })
  }
}

var onReorder = function(delay) {
  return function(node, props) {
    // console.log('onReorder')
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

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16)
}

function createBars(count, key) {
  var kids = []
    , value

  for (var i = 0; i < count;i ++) {
    value = 50 + 50*(i + 2)*Math.random()
    kids.push(
      h('div.bar'
      , lifecycle({key:key+i, data: {className: { sth : true }}, data: value, color: getRandomColor()})
      , ['Bar'+i])
    )
  }

  return kids
}

function run(counter, flip) {
  // var root = h('span.root') //dont attach lifecycle to root
  //   , redraw
  //   , flipOp
  //
  // redraw = h('button', {key:'redraw', 'onclick': function() { run(c++, !flip) }}, ['redraw'])
  // flipOp = h('input', {key:'flip', type: 'checkbox', 'onclick': function() { run(c++, true) }}, ['redraw'])
  //
  // //do not use assign var count to this as it is occupated by diff -there is a clash
  // //indexes will have wrong index (diff:108)
  // var Chart = function(id){
  //   this.id = id; 
  // }
  // Chart.prototype.type = 'Thunk'
  // Chart.prototype.render = function(previous) {
  //   return h('div', createBars(1, 'tes').concat([this.id + Math.random()]))
  // }
  //
  // var Thunk = require("vdom-thunk")
  //
  // var thunk = function (a) {
  //   return h('div', createBars(1, 'tes').concat([Math.random()]))
  // }
  //
  // var loaded = false
  // var deffered = function(delay) {
  //   return { 
  //     type: 'Widget'
  //   , deffered: true
  //   , render: function(ok) {
  //       var markup = function() {
  //         var bars = createBars(5, 'deffered-child')
  //
  //         if(flip)
  //           bars = bars.reverse()
  //
  //         loaded = true
  //         return ok(h('div', {className: 'container'}, bars))
  //       }
  //       return !loaded ? setTimeout(markup, delay) : markup()
  //     }
  //   }
  // }
  //
  // root.children = [redraw
  // , deffered(1)
  // , Thunk(thunk, 'test')
  // , new Chart("Thunk!"+c)
  // ]

    h('div.bar'
    , {data: {className: { sth : true, sth2: false }}}
    , ['Bar'+0])

  // update(root)
}

run(c++, c%2==0)

// setInterval(function() {
//   console.log('tic tac')
// }, 10)
//vtree-create
//works on array
//insert, append, text (VText), css, style
//consider: animation
//
