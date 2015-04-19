var Promise = require('bluebird')
var isPromise = require('is-promise')

var nextTick
if (typeof setImediate === 'function') nextTick = setImediate
else if (typeof process === 'object' && process && process.nextTick) nextTick = process.nextTick
else nextTick = function (cb) { setTimeout(cb, 0) }

module.exports = nodeify
function nodeify(promise, cb, options) {
  if (typeof cb !== 'function') return promise
  return promise
    .then(function (res) {
      nextTick(function () {
        if (options && options.spread) {
          cb.apply(null, [null].concat(res))
        } else cb(null, res)
      })
    }, function (err) {
      nextTick(function () {
        cb(err)
      })
    })
}
function nodeifyThis(cb, options) {
  return nodeify(this, cb, options)
}

nodeify.extend = extend
nodeify.Promise = NodeifyPromise

function extend(prom) {
  if (prom && isPromise(prom)) {
    prom.nodeify = nodeifyThis
    var then = prom.then
    prom.then = function () {
      return extend(then.apply(this, arguments))
    }
    return prom
  } else if (typeof prom === 'function') {
    prom.prototype.nodeify = nodeifyThis
  } else {
    Promise.prototype.nodeify = nodeifyThis
  }
}

function NodeifyPromise(fn) {
  if (!(this instanceof NodeifyPromise)) {
    return new NodeifyPromise(fn)
  }
  Promise.call(this, fn)
  extend(this)
}

NodeifyPromise.prototype = Object.create(Promise.prototype)
NodeifyPromise.prototype.constructor = NodeifyPromise
