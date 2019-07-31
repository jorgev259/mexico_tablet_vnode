var express = require('express')
var router = express.Router()
var fs = require('fs')
let { checkAccess, pool } = require('../helper.js')
var groupArray = require('group-array')
const moment = require('moment')
const programas = require('../public/json/tunel_programas.json')
const mlxseg = require('../public/json/tunel_mlxseg.json')
const tiempos = require('../public/json/tunel_tiempos_quimicos.json')

module.exports = io => {
  router.get('/tunel', function (req, res) {
    res.render('tunel/tunel.ejs')
  })
  router.get('/tunel/programa', function (req, res) {
    res.render('tunel/programa.ejs')
  })
  router.get('/tunel/quimicos', function (req, res) {
    res.render('tunel/quimicos.ejs')
  })

  router.get('/tunel/update', function (req, res) {
    console.log('Actualizando tunel....')
    fs.readFile('public/Output_PowerTrans.txt', 'utf-8', async (err, data) => {
      if (err) throw err
      let allEntries = data.replace(/\r?\n|\r/g, '').split('* end ')
      res.write(`Actualizacion en progreso`)

      var entries = allEntries.reduce(function (result, entry) {
        if (entry.length > 0) {
          entry = entry.split(';')
          entry.pop()

          let date = entry[0].split('/')[2] + '-' + entry[0].split('/')[0] + '-' + entry[0].split('/')[1]
          let hour = ''

          if (entry[1].split(' ')[1] === 'PM' && entry[1].split(':')[0] !== '12') {
            let temp = entry[1].split(' ')[0].split(':')
            temp[0] = parseInt(temp[0]) + 12
            hour = temp.join(':')
          } else {
            hour = entry[1].split(' ')[0]
          }

          result.push({
            startTime: (new Date(date + ' ' + hour)).getTime(),
            programa: Number.parseFloat(entry[2]),
            peso: Number.parseFloat(entry[4]),
            cliente: entry[5],
            camara_3: entry[14],
            camara_8: entry[15],
            camara_9: entry[16],
            camara_11: entry[17],
            tanque_1: entry[18],
            tanque2: entry[19]
          })
        }
        return result
      }, [])

      let client = await pool

      const collection = await client.db('vsmart').collection('tunel')
      await collection.deleteMany({})
      collection.insertMany(entries, { ordered: false })
        .then(() => {
          res.write('\nComplete!')
          io.emit('tunel_update')
          res.status(200).end()
        }).catch(err => {
          res.write(`\nComplete! ${err.result.nInserted}`)
          io.emit('tunel_update')
          res.status(200).end()
        })
    })
  })

  router.get('/tunel/registro/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.find({ startTime: options }).toArray()
      .then(queryRes => res.send(queryRes))
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/quimicos/registro/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.aggregate([
      { $match: { startTime: options } },
      {
        $group: {
          _id: '$programa',
          count: { $sum: 1 }
        } }
    ]).toArray()
      .then(queryRes => res.send(queryRes.map(e => {
        let count = e.count
        let quimicos = ['Detergente', 'Alcalino', 'Sanitizante', 'Blanqueador']
        e.Programa = programas[e._id - 1] ? programas[e._id - 1].nombre : e._id
        let total = 0
        quimicos.forEach(q => {
          let tiempo = tiempos[e._id - 1] ? tiempos[e._id - 1][q] : 0
          let dosis = mlxseg[e._id - 1] ? mlxseg[e._id - 1][q] : 0
          e[q] = count * dosis * tiempo / 1000

          total += e[q]
        })
        e.Total = total
        e.Codigo = e._id
        delete e._id
        delete e.count
        return e
      })))
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/quimicos/mensual/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.aggregate({ startTime: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.startTime / 1000)
          let key = `${time.month() + 1}/${time.year()}`

          let quimicos = ['Detergente', 'Alcalino', 'Sanitizante', 'Blanqueador']

          if (!rows.some(r => r.Fecha === key && r.Codigo === e.programa)) rows.push({ Programa: programas[e.programa - 1] ? programas[e.programa - 1].nombre : e.programa, Fecha: key, Codigo: e.programa, Alcalino: 0, Blanqueador: 0, Detergente: 0, Sanitizante: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Codigo === e.programa)

          quimicos.forEach(q => {
            let tiempo = tiempos[e.programa - 1] ? tiempos[e.programa - 1][q] : 0
            let dosis = mlxseg[e.programa - 1] ? mlxseg[e.programa - 1][q] : 0

            rows[index][q] += dosis * tiempo / 1000
          })
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      }).catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/quimicos/diario/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.aggregate({ startTime: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.startTime / 1000)
          let key = `${time.date()}/${time.month() + 1}/${time.year()}`

          let quimicos = ['Detergente', 'Alcalino', 'Sanitizante', 'Blanqueador']

          if (!rows.some(r => r.Fecha === key && r.Codigo === e.programa)) rows.push({ Programa: programas[e.programa - 1] ? programas[e.programa - 1].nombre : e.programa, Fecha: key, Codigo: e.programa, Alcalino: 0, Blanqueador: 0, Detergente: 0, Sanitizante: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Codigo === e.programa)

          quimicos.forEach(q => {
            let tiempo = tiempos[e.programa - 1] ? tiempos[e.programa - 1][q] : 0
            let dosis = mlxseg[e.programa - 1] ? mlxseg[e.programa - 1][q] : 0

            rows[index][q] += dosis * tiempo / 1000
          })
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      }).catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/programa/registro/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.find([
      { $match: { startTime: options } },
      {
        $group: {
          _id: '$programa',
          Total: { $sum: '$peso' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray()
      .then(queryRes => {
        let rows = queryRes.map(e => {
          e.Codigo = e._id
          e.Programa = programas[e._id - 1] ? programas[e._id - 1].nombre : e._id
          delete e._id
          return e
        })

        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/programa/mensual/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.find({ startTime: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.startTime / 1000)
          let key = `${time.month() + 1}/${time.year()}`

          if (!rows.some(r => r.Fecha === key && r.Codigo === e.programa)) rows.push({ Programa: programas[e.programa - 1] ? programas[e.programa - 1].nombre : e.programa, Fecha: key, Codigo: e.programa, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Codigo === e.programa)

          rows[index].Total += e.peso
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })

  router.get('/tunel/fetch/programa/diario/:start/:end', async function (req, res) {
    let client = await pool
    const collection = await client.db('vsmart').collection('tunel')

    let start = moment.unix(req.params.start / 1000)
    let end = moment.unix(req.params.end / 1000)

    let options = {
      $gte: start.valueOf(),
      $lt: end.valueOf()
    }

    collection.find({ startTime: options }).toArray()
      .then(queryRes => {
        let rows = []
        queryRes.forEach(e => {
          let time = moment.unix(e.startTime / 1000)
          let key = `${time.date()}/${time.month() + 1}/${time.year()}`

          if (!rows.some(r => r.Fecha === key && r.Codigo === e.programa)) rows.push({ Programa: programas[e.programa - 1] ? programas[e.programa - 1].nombre : e.programa, Fecha: key, Codigo: e.programa, Total: 0 })
          let index = rows.findIndex(r => r.Fecha === key && r.Codigo === e.programa)

          rows[index].Total += e.peso
        })
        rows.sort(function (x, y) { return x.Fecha - y.Fecha || x.Codigo - y.Codigo })
        res.send(rows)
      })
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  })
  /* router.get('/tunel/registro/:date', async function (req, res) {
    let client = await pool

    const collection = await client.db('vsmart').collection('tunel')

    var start = moment(req.params.date).utc().startOf('day').toDate()
    var end = moment(req.params.date).utc().endOf('day').toDate()

    collection.find({ startTime: { '$gte': start, '$lt': end } }).toArray()
      .then(queryRes => res.send(queryRes))
      .catch(e => {
        console.log(e)
        res.sendStatus(500)
      })
  }) */
  return router
}

var groupBy = (array, props) => {
  var getGroupedItems = (item) => {
    var returnArray = []
    let i
    for (i = 0; i < props.length; i++) {
      returnArray.push(item[props[i]])
    }
    return returnArray
  }

  let groups = {}
  let i

  for (i = 0; i < array.length; i++) {
    const arrayRecord = array[i]
    const group = JSON.stringify(getGroupedItems(arrayRecord))
    groups[group] = groups[group] || []
    groups[group].push(arrayRecord)
  }
  return Object.keys(groups).map((group) => {
    return groups[group]
  })
}
