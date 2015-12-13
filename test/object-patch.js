var test = require("tape")
  , sinon = require("sinon")
  , _ = require('lodash')

var patch = require('../vdom/object-patch')

test("replace value in place", function (assert) {

  var transforms = {
    'data.className': {
      transform: function(val, old) {
        return Object
            .keys(val)
            .filter(function(a) { 
              return val[a] 
            })
      }
    }
  }

  var obj = { 
    data: { 
      className: { 
        container: true
      , shiny: true
      , dull: false
      } 
  }}

  var r = patch(obj, transforms)
  assert.equal(obj.data.className.join(), ['container', 'shiny'].join())
  assert.end()
})

test("move and replace (by default) value to other place", function (assert) {

  var transforms = {
    'data.className': {
      transform: function(val, old) {
        return Object
            .keys(val)
            .filter(function(a) { 
              return val[a] 
            })
      }
    , to: 'style.classes'
    }
  }

  var obj = { 
    data: { 
      className: { 
        container: true
      , shiny: true
      , dull: false
      } 
  }}

  var r = patch(obj, transforms)

  assert.ok(!obj.data)
  assert.equal(obj.style.classes.join(), ['container', 'shiny'].join())
  assert.end()
})

test("move and replace (by default) value to other place and remove old val", function (assert) {

  var transforms = {
    'data.className': {
      transform: function(val, old) {
        return Object
            .keys(val)
            .filter(function(a) { 
              return val[a] 
            })
      }
    , to: 'style.classes'
    , replace: true
    }
  }

  var obj = { 
    data: { 
      className: { 
        container: true
      , shiny: true
      , dull: false
      } 
  }}

  var r = patch(obj, transforms)

  assert.ok(!obj.data)
  assert.equal(obj.style.classes.join(), ['container', 'shiny'].join())
  assert.end()
})

test("copy to", function (assert) {

  var transforms = {
    'data.className': {
      transform: function(val, old) {
        return _.keys(val).filter(function(a) { return val[a] })
      }
    } 
  }

  var obj = { 
    data: { 
      className: { 
        container: true
      , dull: false
      } 
  }}

  var r = patch(obj, transforms, { new: true })

  console.log('copy to', r)
  console.log('org item', obj)

  assert.equal(r.data.className.join(), ['container'].join())
  assert.end()
})

test("copy and rename path", function (assert) {

  var transforms = {
    'data.className': {
      transform: function(val, old) {
        return _.keys(val).filter(function(a) { return val[a] })
      },
      to: 'style.classes'
    } 
  }

  var obj = { 
    data: { 
      className: { 
        container: true
      , dull: false
      } 
  }}

  var r = patch(obj, transforms, { new: true })

  assert.equal(obj.data.className.container, true)
  assert.equal(r.style.classes.join(), ['container'].join())
  assert.end()
})

// // props: { type: 'text', placeholder: 'Type  your name' },
//   // on   : { input: update }