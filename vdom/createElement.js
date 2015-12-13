var _createElement = require('virtual-dom/vdom/create-element')
  , isThunk = require('virtual-dom/vnode/is-thunk')

//TODO instead of wrapping from virtual-dom, wrap from renderOptions!
module.exports = function createElement(vnode, opts) {
  if (vnode && vnode.deffered) {
    return new Promise(vnode.render)
    .then(function(node) {
      var a = _createElement(node, opts)
      a._node = node
      vnode._node = node
      return a
    })
  }
  return _createElement(vnode, opts)
}

