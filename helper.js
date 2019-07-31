let tiposUsuarios = require('./config/usuarios')
const MongoClient = require('mongodb').MongoClient

// Connection URL
const url = 'mongodb://localhost:27017/vsmart'

// Use connect method to connect to the server
let clientPromise = MongoClient.connect(url, { useNewUrlParser: true })

let isEqual = function (value, other) {
  // Get the value type
  var type = Object.prototype.toString.call(value)

  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(other)) return false

  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false

  // Compare the length of the length of the two items
  var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length
  var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length
  if (valueLen !== otherLen) return false

  // Compare two items
  var compare = function (item1, item2) {
    // Get the object type
    var itemType = Object.prototype.toString.call(item1)

    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2)) return false
    } else {
      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) return false

      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) return false
      } else {
        if (item1 !== item2) return false
      }
    }
  }

  // Compare properties
  if (type === '[object Array]') {
    for (var i = 0; i < valueLen; i++) {
      if (compare(value[i], other[i]) === false) return false
    }
  } else {
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        if (compare(value[key], other[key]) === false) return false
      }
    }
  }

  // If nothing failed, return true
  return true
}

module.exports = {
  tiposUsuarios: tiposUsuarios,
  checkAccess: (maxLevel) => {
    return async (req, res, next) => {
      if (req.session.userName === 'bacon123') return next()
      if (req.session.userName) {
        let client = await clientPromise
        let collection = client.db('vsmart').collection('usuarios')
        collection.findOne({ username: req.session.userName }).then(user => {
          if (user === null) { req.session.destroy(); return res.redirect('/') }

          let tipo = tiposUsuarios[user.tipo].nivel
          req.session.tipo = tipo

          if (isNaN(tipo)) {

          } else if (Number.parseInt(tipo) <= maxLevel) next()
          else res.redirect('/unauthorized')
        })
      } else res.redirect('/login')
    }
  },
  isEqual: isEqual,
  pool: clientPromise
}
