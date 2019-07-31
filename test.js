const https = require('http')
var $ = { logger: { warn: console.log } }
var tag = {}
var data = {}
$.logger.warn('Tag updated: %s at %j', tag, data)


const data2 = JSON.stringify({ tag: tag, data: data })

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/tag_change',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data2.length
  }
}

const req = https.request(options, function (res) {
  $.logger.warn('statusCode: ' + res.statusCode)

  res.on('data', function (d) {
    $.logger.warn(d)
  })
})

req.on('error', function (error) {
  console.log('here')
  $.logger.warn(error)
})

req.write(data2)
req.end()
