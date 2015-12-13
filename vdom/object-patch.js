var _ = require('lodash')
  , forEach = _.forEach
  , getObject = _.get
  , has = _.has

var getOption = function(opt) { return (typeof opt == 'undefined') || opt }

var createNonExistingFields = function(obj, path) {
  var exists = has(obj, path)
    , parts = path.split('.')

  if (exists) return

  _.reduce(parts, function(memo, val) {
    if(!memo[val]) memo[val] = {}
    return memo[val]
  }, obj)

  return obj
}

module.exports = function applyTransforms(obj, transforms, opts) {
  opts = opts || {}

  var createNew = opts.new
    , target = createNew ? {} : obj

  forEach(transforms, function(property, originalLocation) {
    var replace = getOption(property.replace)

    var dest = property.to || originalLocation
      , a = getObject(obj, originalLocation)
      , b = getObject(target, dest)

    var sameLocation = dest == originalLocation
      , path = dest.split('.')

    createNonExistingFields(target, dest)

    var last = path.pop()
    b = getObject(target, path.join('.'))
    b[last] = property.transform(a, b[last])

    replace = replace && !sameLocation && !createNew
    replace && delete obj[originalLocation.split('.')[0]]
  })

  return target
}
