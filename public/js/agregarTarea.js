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

$('#addTarea').submit(function (event) {
  toastr.clear()
  let serialData = {}

  $('#addTarea').serializeArray().forEach(e => {
    serialData[e.name] = e.value
  })

  axios.post('/tarea', serialData).then(function (response) {
    toastr['success']('Ingreso correcto!')
  }).catch(function (error) {
    console.log(error.response)
    toastr['error'](error.response.data || 'Error de servidor')
  })
  event.preventDefault()
})
