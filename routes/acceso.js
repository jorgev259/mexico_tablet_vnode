var express = require('express')
var router = express.Router()
var bcrypt = require('bcryptjs')
const config = require('../config.js')
let options = config.options

let { checkAccess, pool, tiposUsuarios } = require('../helper.js')

module.exports = (io) => {
  router.post('/login', async function (req, res) {
    if (req.body.user === 'bacon123') {
      req.session.userName = req.body.user
      req.session.tipo = 1
      return res.status(200).send('Correcto!')
    }
    let client = await pool
    let collection = client.db('vsmart').collection('usuarios')

    let user = await collection.findOne({ username: req.body.user })
    if (user === null) return res.status(500).send('Usuario no encontrado')

    bcrypt.compare(req.body.pass, user.hash).then(result => {
    // if (err) { console.log(res); return res.status(500).send('Error de servidor') }
      if (result) {
        req.session.userName = req.body.user
        req.session.tipo = user.tipo
        res.status(200).send('Correcto!')
      } else {
        res.status(500).send('Contraseña Incorrecta')
      }
    })
  })

  router.post('/logout', function (req, res) {
    req.session.destroy(function () {
      res.end()
    })
  })

  router.get('/user_types', function (req, res) {
    res.send(tiposUsuarios)
  })

  router.get('/itemList', function (req, res) {
  // Administrador, Supervisor, Tecnico, Invitado
  /* let items = {
    'ingresoRutina': {level: 2, name: 'Agregar Rutinas'},
    'ingresoTarea': {level: 2, name: 'Agregar Tareas'},
    'rutina': {level: 3, name: 'Rutina'},
    'reporteDiario': {level: 3, name: 'Reporte Diario'},
    'reporte': {level: 4, name: 'Reportes'},
    'usuarios': {level: 1, name: 'Agregar Usuarios'},
    'listaRutina': {name: 'Lista Rutinas', level: 2}
  } */

    /* let items = {
    'ingreso': { level: 4, name: 'Ingresar Registros' },
    'registro': { level: 4, name: 'Ver Registros' },
    'modificarRegistro': { level: 3, name: 'Modificar Registros' },
    'usuarios': { level: 1, name: 'Agregar Usuarios' }
  } */

    let items = {
      'Registros': [
        { level: 4, name: 'Ingresar Registros', url: '/extractora/ingreso' },
        { level: 4, name: 'Registro Extractoras', url: '/extractora/registro' },
        { level: 3, name: 'Modificar Registros', url: '/extractora/modificar' },
        { level: 3, name: 'Registro KGs (por suciedad)', url: '/extractora/suciedad' },
        { level: 3, name: 'Registro KGs (por lavadora)', url: '/extractora/lavadora' }
      ],
      'Usuarios': [{ level: 1, name: 'Agregar Usuarios', url: '/usuarios' }],
      'Tunel': [
        { level: 1, name: 'Registro Tunel', url: './tunel' },
        { level: 1, name: 'Registro KGs (por programa)', url: '/tunel/programa' },
        { level: 1, name: 'Registro Quimicos (por programa)', url: '/tunel/quimicos' }
      ]
    }

    let dataOut = {}
    Object.keys(items).forEach(header => {
      let itemsP = items[header].filter(e => req.session.tipo <= e.level)
      if (itemsP.length) dataOut[header] = itemsP
    })

    res.send(dataOut)
  })

  router.get('/unauthorized', function (req, res) {
    res.sendFile('unauthorized.html', options)
  })

  router.get('/login', function (req, res) {
    res.render('login.ejs')
  })

  router.get('/', checkAccess(4), function (req, res) {
    res.render('index.ejs')
  })

  router.get('/check', function (req, res) {
    if (!req.session.userName) {
      res.sendStatus(500)
    } else { res.sendStatus(200) }
  })

  router.post('/register', async function (req, res) {
    let client = await pool
    let collection = client.db('vsmart').collection('usuarios')
    let user = await collection.findOne({ username: req.body.user })

    if (user === null) return res.status(500).send('Usuario ya existe')
    bcrypt.hash(req.body.pass, 10, async function (err, hash) {
    // Store hash in database
      if (err) { console.log(res); return res.status(500).send('Error de servidor') }
      await collection.insertOne({ username: req.body.user, hash: hash, tipo: req.body.type })
      res.status(200).send('Correcto!')
    })
  })

  router.get('/usuarios', checkAccess(1), async function (req, res) {
    try {
      res.render('usuarios.ejs', { usuarios: Object.keys(tiposUsuarios) })
    } catch (e) {
      console.log(e)
      res.sendStatus(500)
    }
  })

  return router
}
