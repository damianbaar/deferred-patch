### Deffered patch for virtual-dom

Proof of concept or playground rather than lib (yet). Goal is to make `virtual-dom` patching fully asynchronous to be able to create more rich user expirience enhanced by animations. 
`deffered-patch` does not include any logic for rendering queues, basically if you would like to revalidate/make a new patch you have to be sure that previous rendering phase ended. For now it is intentional to delegate such logic in some other place 

[Example](http://damianbaar.github.io/deferred-patch/)

```js
var h = require('virtual-dom/h')
  , diff = require('virtual-dom/diff')
  , patch = require('virtual-dom/patch')
  , createElement = require('virtual-dom/create-element')
  , Velocity = require('velocity-animate')

var onUpdate = function(delay) {
  return function(node, props) {
    return new Promise(function(next) {
      next() //parallel
      Velocity(node, 
        { backgroundColor: props.new.color, width: props.new.data }
      //or , { complete: ok } //in series
      )
    })
  }
}

var onEnter //similar to update
  , onExit  //similar to update

var lifecycle = function(custom) {
  return Object.assign(custom || {}, {    
      onEnter: onEnter(100)
    , onUpdate: onUpdate(100)
    , onExit: onExit(100)
  })
}
var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var update = function(newtree) {
    patches = diff(tree, newtree)
    //patch itself expose a way to change a rendering options
    //defferedPatch is a Promise
    var defferedPatch = patch(rootNode, patches, { patch: require('deffered-patch') })

    defferedPatch.then(function(node) { rootNode = node })
    tree = newtree
  }

  update(h('span', 
           [ h('div', lifecycle({key: 1}), ['child1']) ]))

```
