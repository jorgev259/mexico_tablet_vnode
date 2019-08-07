var argv = require('minimist')(process.argv.slice(2))
const path = require('path')

var partials = require('express-partials')
let { pool } = require('./helper.js')
var session = require('express-session')
const MongoStore = require('connect-mongo')(session)

var express = require('express')
var app = express()
var router = express.Router()

var http = require('http').createServer(app)
var io = require('socket.io')(http)

async function startup () {
  const bodyParser = require('body-parser')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(session({
    secret: 'controlsoft_mexico',
    store: new MongoStore({ client: await pool })
  }))
  app.set('view engine', 'ejs')
  app.use(partials())
  app.set('views', path.join(__dirname, '/public'))
  app.set('port', process.env.PORT || 3005)

  router.use(require('./routes/acceso')(io))
  router.use(require('./routes/extractora')(io))
  router.use(require('./routes/tunel')(io))

  if (argv.d) {
    router.use('/js', express.static(path.join(__dirname, '/public/js')))
    router.use('/img', express.static(path.join(__dirname, '/public/img')))
    router.use('/style', express.static(path.join(__dirname, '/public/style')))
    router.use('/favicon.ico', express.static(path.join(__dirname, '/public/favicon.ico')))
    app.use('/vnode', router)
  } else {
    app.use('/vnode', router)
  }

  http.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })

  require('./routes/io')(io)
}

startup()
