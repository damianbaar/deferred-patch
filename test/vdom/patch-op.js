var test = require("tape")
  , sinon = require("sinon")

var VNode = require("virtual-dom/vnode/vnode")
  , VText = require("virtual-dom/vnode/vtext")
  , diff = require("virtual-dom/vtree/diff")
  , document = require("global/document")

var createElement = require("virtual-dom/vdom/create-element")
var patch = require("virtual-dom/vdom/patch")
var defferedPatch = require("../../vdom/patch")

function assertPachedNodeIsMarked(leftNode, rightNode, assert) {
    var root = createElement(leftNode)
      , patches = diff(leftNode, rightNode)

    return patch(root, patches, { document: document, patch: defferedPatch })
}


test("fire onEnter method whilist inserting a new dom node", function (assert) {
  var enterStart = sinon.spy()
    , enterEnd = sinon.spy()

  var onEnter = { 
    data: [1,2,3],
    onEnter: function(node, props) { 
      return new Promise(function(ok) {
        enterStart(node.toString(), props)
        setTimeout(function() {
          enterEnd()
          ok()
        }, 10)
      })
      } 
    }

    var leftNode = new VNode("div", {})
    var rightNode = new VNode("div", {}, [new VNode("span", onEnter)])

    assertPachedNodeIsMarked(leftNode, rightNode)
      .then(function(dom) {
        assert.equal(1, enterStart.callCount)
        assert.equal(1, enterEnd.callCount)

        var args = enterStart.getCall(0).args
        assert.equal('<span></span>', args[0])
        assert.equal(args[1].data.join(), '1,2,3')

        assert.equal('<div><span></span></div>', dom.toString())
        assert.end()
      })
})

test("fire onExit method whilist removing a dom node", function (assert) {
  var exitStart = sinon.spy()
    , exitEnd = sinon.spy()

  var lifecycle = { 
    data: [1,2,3],
    onExit: function(node, props) { 
      return new Promise(function(ok) {
        exitStart(node.toString(), props)
        setTimeout(function() {
          exitEnd()
          ok()
        }, 10)
      })
      } 
    }

    var leftNode = new VNode("div", {}, [new VNode("span", lifecycle)])
    var rightNode = new VNode("div", {})

    assertPachedNodeIsMarked(leftNode, rightNode)
      .then(function(dom) {
        assert.equal(1, exitStart.callCount)
        assert.equal(1, exitEnd.callCount)

        var args = exitStart.getCall(0).args
        assert.equal('<span></span>', args[0])
        assert.equal(args[1].data.join(), '1,2,3')

        assert.equal('<div></div>', dom.toString())
        assert.end()
      })
})

test("fire onUpdate method whilist updating a props", function (assert) {
  var updateStart = sinon.spy()
    , updateEnd = sinon.spy()

  var lifecycle = function(data) {
    return { 
      data: data,
      onUpdate: function(node, props) { 
        return new Promise(function(ok) {
          updateStart(node.toString(), props)
          setTimeout(function() {
            updateEnd()
            ok()
          }, 10)
        })
        } 
      }
    }

    var leftNode = new VNode("div", {}, [new VNode("span", lifecycle([1,2,3,4]))])
    var rightNode = new VNode("div", {}, [new VNode("span", lifecycle([3,4,5]))])

    assertPachedNodeIsMarked(leftNode, rightNode)
      .then(function(dom) {
        assert.equal(1, updateStart.callCount)
        assert.equal(1, updateEnd.callCount)

        var args = updateStart.getCall(0).args
          , _old = args[1].old
          , _new = args[1].new

        assert.equal('<span></span>', args[0])

        assert.ok(_old)
        assert.ok(_new)

        assert.equal(_old.data.join(), '1,2,3,4')

        assert.equal(_new.data[0], 3)
        assert.equal(_new.data[1], 4)
        assert.equal(_new.data[2], 5)

        assert.equal('<div><span></span></div>', dom.toString())
        assert.end()
      })
})
