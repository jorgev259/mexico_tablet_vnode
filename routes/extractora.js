var express = require('express')
var router = express.Router()
var fs = require('fs')
let { checkAccess, pool } = require('../helper.js')
var moment = require('moment')
var mongo = require('mongodb')

module.exports = io => {
  router.get('/config/quimicos', checkAccess(4), function (req, res) {
    res.render('config/quimicos.ejs')
  })

  router.get('/extractora/ingreso', checkAccess(4), function (req, res) {
    res.render('extractora/ingreso.ejs')
  })

  router.get('/extractora/registro', checkAccess(4), function (req, res) {
    res.render('extractora/registro.ejs')
  })

  router.get('/extractora/modificar', checkAccess(3), function (req, res) {
    res.render('extractora/modificar.ejs')
  })

  router.get('/extractora/suciedad', checkAccess(3), function (req, res) {
    res.render('extractora/suciedad.ejs')
  })

  router.get('/extractora/lavadora', checkAccess(3), function (req, res) {
    res.render('extractora/lavadora.ejs')
  })

  router.post('/extractora/modificar', checkAccess(3), async function (req, res) {
    var myquery = { _id: new mongo.ObjectID(req.body.id) }
    var newvalues = { $set: { } }
    newvalues.$set[req.body.name] = req.body.value

    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')
    collection.updateOne(myquery, newvalues).then(async () => {
      res.sendStatus(200)
      io.emit('extractora', {})
    }).catch(async err => {
      console.log(err)
      res.sendStatus(500)
    })
  })

  router.post('/extractora', async function (req, res) {
    let client = await pool
    const session = client.startSession()
    session.startTransaction()

    const collection = await client.db('vsmart').collection('extractora')

    let promises = req.body.map(row => collection.insertOne(row))

    Promise.all(promises).then(async () => {
      await session.commitTransaction()
      res.sendStatus(200)
      io.emit('extractora', {})
    }).catch(async err => {
      console.log(err)
      await session.abortTransaction()
      res.sendStatus(500)
    }).finally(() => session.endSession())
  })

  router.get('/extractora/:turno/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    collection.find({ fecha: { $gte: start.valueOf(), $lte: end.valueOf() }, turno: req.params.turno }).toArray()
      .then(queryRes => res.send(queryRes))
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/:turno/:fecha', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.fecha / 1000)
    let end = start.clone()
    end.endOf('day')
    start.startOf('day')

    collection.find({ fecha: { $gte: start.valueOf(), $lte: end.valueOf() }, turno: req.params.turno }).toArray()
      .then(queryRes => res.send(queryRes))
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/suciedad/registro/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.aggregate([
      { $match: { fecha: options } },
      {
        $group: {
          _id: '$suciedad',
          Total: { $sum: '$lavados' }
        }
      }
    ]).toArray()
      .then(queryRes => {
        queryRes.forEach(e => {
          e.Suciedad = e._id
          delete e._id
        })

        res.send(queryRes)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/suciedad/mensual/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.find({ fecha: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.fecha / 1000)
          let key = `${time.month() + 1}/${time.year()}`
          if (!rows.some(r => r.Fecha === key && r.Suciedad === e.suciedad)) rows.push({ Fecha: key, Suciedad: e.suciedad, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Suciedad === e.suciedad)

          rows[index].Total += e.lavados
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/suciedad/diario/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.find({ fecha: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.fecha / 1000)
          let key = `${time.date()}/${time.month() + 1}/${time.year()}`
          if (!rows.some(r => r.Fecha === key && r.Suciedad === e.suciedad)) rows.push({ Fecha: key, Suciedad: e.suciedad, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Suciedad === e.suciedad)

          rows[index].Total += e.lavados
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/lavadora/registro/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.aggregate([
      { $match: { fecha: options } },
      {
        $group: {
          _id: '$lavadora',
          Total: { $sum: '$lavados' }
        }
      }
    ]).toArray()
      .then(queryRes => {
        queryRes.forEach(e => {
          e.Lavadora = e._id
          delete e._id
        })
        res.send(queryRes)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/lavadora/mensual/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.find({ fecha: options }).toArray()
      .then(queryRes =>{
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.fecha / 1000)
          let key = `${time.month() + 1}/${time.year()}`
          if (!rows.some(r => r.Fecha === key && r.Lavadora === e.lavadora)) rows.push({ Fecha: key, Lavadora: e.lavadora, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Lavadora === e.lavadora)

          rows[index].Total += e.lavados
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/extractora/fetch/lavadora/diario/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('extractora')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lte: end.valueOf()
    }

    collection.find({ fecha: options }).toArray()
      .then(queryRes =>{
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.fecha / 1000)
          let key = `${time.date()}/${time.month() + 1}/${time.year()}`
          if (!rows.some(r => r.Fecha === key && r.Lavadora === e.lavadora)) rows.push({ Fecha: key, Lavadora: e.lavadora, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Lavadora === e.lavadora)

          rows[index].Total += e.lavados
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  return router
}
