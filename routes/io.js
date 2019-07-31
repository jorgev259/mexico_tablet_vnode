let cacheTags = {}
const axios = require('axios')
let pollingTags = {}
var asyncPolling = require('async-polling')

module.exports = io => {
  axios.get('http://localhost:3003/tags?cmd=read&path=/Mexico/%2A').then(res => {
    let { data } = res
    Object.keys(data.groups).forEach(lavadoraName => {
      let lavadora = data.groups[lavadoraName]
      Object.keys(lavadora.groups).forEach(ropaName => {
        let ropa = lavadora.groups[ropaName]
        Object.keys(ropa.tags).forEach(quimicoName => {
          var tagPath = `/Mexico/${lavadoraName}/${ropaName}/${quimicoName}`
          let quimico = ropa.tags[quimicoName]
          cacheTags[tagPath] = quimico.data

          pollingTags[tagPath] = asyncPolling(async function (end) {
            var info = cacheTags[tagPath]
            var { data } = (await axios.get(`http://localhost:3003/tags?cmd=read&path=${tagPath}`)).data

            if (info.value !== data.value || info.ts !== data.ts) end(null, { tag: tagPath, data: data })
            else end()
          }, 1000)

          pollingTags[tagPath].on('error', function (error) {
            console.log(error)
          })

          pollingTags[tagPath].on('result', function (result) {
            if (result) {
              cacheTags[tagPath] = result.data
              io.emit(tagPath, data)
            }
          })
          pollingTags[tagPath].run()
        })
      })
    })
  })
}
