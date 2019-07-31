/* global axios,$,toastr */
toastr.options = {
  'closeButton': true,
  'debug': false,
  'newestOnTop': false,
  'progressBar': false,
  'positionClass': 'toast-top-right',
  'preventDuplicates': true,
  'onclick': null,
  'showDuration': '300',
  'hideDuration': '1000',
  'timeOut': '0',
  'extendedTimeOut': '0',
  'showEasing': 'swing',
  'hideEasing': 'linear',
  'showMethod': 'fadeIn',
  'hideMethod': 'fadeOut'
}

$('#addReporte').submit(function (event) {
  toastr.clear()
  let serialData = {}

  $('#addReporte').serializeArray().forEach(e => {
    if (e.name.startsWith('observacion')) {
      if (!serialData[e.name.split('observacion')[1]]) serialData[e.name.split('observacion')[1]] = {}
      serialData[e.name.split('observacion')[1]].observacion = e.value
    } else if (e.name.startsWith('rutina')) {
      if (!serialData[e.name.split('rutina')[1]]) serialData[e.name.split('rutina')[1]] = {}
      serialData[e.name.split('rutina')[1]].cambio = e.value === 'YES' ? 1 : 0
    }
  })

  axios.post('/reporte', serialData).then(function (response) {
    toastr['success']('Ingreso correcto!')
  }).catch(function (error) {
    console.log(error.response)
    toastr['error'](error.response.data || 'Error de servidor')
  })
  event.preventDefault()
})
