var _createElement = require('virtual-dom/vdom/create-element')
  , isThunk = require('virtual-dom/vnode/is-thunk')

//TODO instead of wrapping from virtual-dom, wrap from renderOptions!
module.exports = function createElement(vnode, opts) {
  if (vnode && vnode.then) {
    return vnode.then(function(node) {
      return _createElement(node, opts)
    })
  }
  return _createElement(vnode, opts)
}

function handleLazyThunk() {

}
