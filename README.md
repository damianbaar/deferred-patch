### Deffered patch for virtual-dom

Proof of concept or playground rather than lib (yet). Goal is to make `virtual-dom` patching fully asynchronous to be able to create more rich user expirience enhanced by animations. 
`deffered-patch` does not include any logic for rendering queues, basically if you would like to revalidate/make a new patch you have to be sure that previous rendering phase ended. For now it is intentional to delegate such logic in some other place 

##### TODO
* implement `enter`/`update`/`exit` for each node - 'remove' partially done

```js
var patches
  , tree = h('span')
  , rootNode = createElement(tree)

document.body.appendChild(rootNode)

var update = function(newtree) {
    patches = diff(tree, newtree)
    var defferedPatch = patch(rootNode, patches, { renderOptions: { render: require('deffered-patch') }})

    defferedPatch.then(function(d) { rootNode = d[0] }) //Promise.all this is why there is an array, temp solution
    tree = newtree
  }

var onRemove = function(delay) {
  return function(node) {
    return new Promise(function(ok, err) {
      node.style.color = '#DDEEFF' //marked to be removed

      setTimeout(function() {
        node.style.color = '#FF0000'
        setTimeout(ok, 200)
      }, delay)
    })
  }
  }

  update(h('span', 
           [ h('div', {onRemove:onRemove(100)}, ['child1']),
             h('div', {onRemove:onRemove(200)}, ['child2']),
             h('div', {}, [ 
               h('div', {onRemove:onRemove(300)}, ['nested child1']),
               h('div', {}, [ h('div', {}, [ 
                 h('div', {onRemove:onRemove(500)}, ['nested child1']),
                 h('div', {onRemove:onRemove(600)}, ['nested child2']),
                 ])
               ])
             ])
           ]))

  update(h('span'))

```
